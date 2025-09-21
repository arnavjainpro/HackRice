import os
import pandas as pd
import json
import logging
from typing import List, Dict, Any

import google.generativeai as genai
from api.supabase_retriever import SupabaseRetriever

logger = logging.getLogger(__name__)

class AiAlternativeFinder:
    """
    A class to handle all AI-powered logic for finding and validating drug alternatives.
    Fixed version with proper error handling and Supabase compatibility.
    """

    def __init__(self, supabase_retriever: SupabaseRetriever):
        """
        Initializes the AI client and the database retriever.
        """
        if 'GEMINI_API_KEY' not in os.environ:
            raise ValueError("GEMINI_API_KEY environment variable not set.")
        
        genai.configure(api_key=os.environ['GEMINI_API_KEY'])
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
        self.supabase_retriever = supabase_retriever

    def _generate_alternatives_from_ai(self, drug_names: List[str]) -> Dict[str, List[str]]:
        """
        Makes a single call to Gemini API to get therapeutic alternatives.
        """
        if not drug_names:
            return {}

        drug_list_str = ", ".join(drug_names)
        
        prompt = f"""
        You are an expert pharmacist. Provide 2-3 common FDA-approved therapeutic alternatives for each medication.

        Example format:
        DRUG: Atorvastatin 20mg
        Alternative 1: Rosuvastatin 10mg
        Alternative 2: Simvastatin 40mg

        Now provide alternatives for: {drug_list_str}

        Format your response EXACTLY as:
        DRUG: [Original Drug Name]
        Alternative 1: [Substitute Name]
        Alternative 2: [Substitute Name]
        Alternative 3: [Substitute Name]

        Separate each drug with a blank line.
        """

        try:
            response = self.model.generate_content(prompt)
            return self._parse_ai_response(response.text)
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return {}

    def _parse_ai_response(self, response_text: str) -> Dict[str, List[str]]:
        """
        Parse the AI response into a structured dictionary.
        """
        parsed_alternatives = {}
        current_drug = None
        
        for line in response_text.strip().split('\n'):
            line = line.strip()
            if line.startswith('DRUG:'):
                current_drug = line.replace('DRUG:', '').strip()
                parsed_alternatives[current_drug] = []
            elif line.startswith('Alternative') and current_drug:
                try:
                    alt_name = line.split(':', 1)[1].strip()
                    parsed_alternatives[current_drug].append(alt_name)
                except IndexError:
                    continue
        
        return parsed_alternatives

    def _get_all_inventory(self) -> pd.DataFrame:
        """
        Get all inventory data from Supabase (more reliable than filtering).
        """
        try:
            return self.supabase_retriever.get_pharmacy_inventory()
        except Exception as e:
            logger.error(f"Error fetching inventory: {e}")
            return pd.DataFrame()

    def _find_alternatives_in_inventory(self, alternatives: List[str], inventory_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Find which alternatives are available in inventory using fuzzy matching.
        """
        if inventory_df.empty:
            return []
        
        available_alternatives = []
        
        for alt_name in alternatives:
            # Clean the alternative name for matching
            alt_clean = alt_name.lower().strip()
            
            # Try exact match first
            exact_match = inventory_df[inventory_df['drug_name'].str.lower().str.strip() == alt_clean]
            
            if not exact_match.empty:
                match = exact_match.iloc[0]
                available_alternatives.append({
                    'name': match['drug_name'],
                    'stock': int(match['stock']),
                    'days_of_supply': round(match.get('days_of_supply', 0), 1),
                    'match_type': 'exact'
                })
                continue
            
            # Try partial match
            partial_matches = inventory_df[
                inventory_df['drug_name'].str.lower().str.contains(
                    alt_clean.split()[0], na=False, regex=False
                )
            ]
            
            if not partial_matches.empty:
                # Take the first partial match
                match = partial_matches.iloc[0]
                available_alternatives.append({
                    'name': match['drug_name'],
                    'stock': int(match['stock']),
                    'days_of_supply': round(match.get('days_of_supply', 0), 1),
                    'match_type': 'partial'
                })
        
        return available_alternatives

    def find_and_validate_alternatives(self, drug_names_in_shortage: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Main method to find alternatives that are both AI-suggested and in stock.
        """
        # Step 1: Get AI suggestions
        ai_suggestions = self._generate_alternatives_from_ai(drug_names_in_shortage)
        if not ai_suggestions:
            logger.warning("No AI suggestions received")
            return {drug: [] for drug in drug_names_in_shortage}

        # Step 2: Get all inventory data
        inventory_df = self._get_all_inventory()
        if inventory_df.empty:
            logger.warning("No inventory data available")
            return {drug: [] for drug in drug_names_in_shortage}

        # Step 3: Find alternatives in inventory
        final_validated_alternatives = {}
        
        for original_drug, suggested_alts in ai_suggestions.items():
            available_alts = self._find_alternatives_in_inventory(suggested_alts, inventory_df)
            
            # Filter by business logic (>14 days supply)
            valid_alts = [
                alt for alt in available_alts 
                if alt['days_of_supply'] > 14
            ]
            
            final_validated_alternatives[original_drug] = valid_alts
            
        return final_validated_alternatives

    def generate_communication_for_doctor(self, original_drug: str, validated_alternatives: List[Dict[str, Any]]) -> str:
        """
        Generate professional communication for the doctor.
        """
        if not validated_alternatives:
            alternatives_text = "No suitable alternatives with adequate supply are currently in stock."
        else:
            alt_lines = [
                f"- {alt['name']} ({alt['days_of_supply']} days supply, {alt['stock']} units)"
                for alt in validated_alternatives
            ]
            alternatives_text = "The following in-stock therapeutic alternatives are available:\n" + "\n".join(alt_lines)

        prompt = f"""
        Draft a professional message from a pharmacy to a physician about a drug shortage.

        Context:
        - Drug in Shortage: {original_drug}
        - Available Alternatives: {alternatives_text}

        Create a brief, professional message that:
        1. Notifies about the shortage
        2. Lists available alternatives
        3. Requests guidance on substitution

        Keep it under 150 words and professional.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error generating communication: {e}")
            return self._fallback_communication(original_drug, validated_alternatives)

    def _fallback_communication(self, original_drug: str, validated_alternatives: List[Dict[str, Any]]) -> str:
        """
        Fallback communication template if AI fails.
        """
        message = f"Dear Dr. [Physician Name],\n\n"
        message += f"We are writing to inform you of a shortage affecting {original_drug}.\n\n"
        
        if validated_alternatives:
            message += "We have the following alternatives in stock:\n"
            for alt in validated_alternatives:
                message += f"- {alt['name']} ({alt['stock']} units available)\n"
            message += "\nPlease advise on your preferred alternative for future prescriptions.\n\n"
        else:
            message += "We currently do not have suitable alternatives in stock but are working to source appropriate substitutions.\n\n"
        
        message += "Best regards,\n[Pharmacy Name]\n[Contact Information]"
        return message

    def process_drug_alert(self, drug_alert_data: Dict) -> Dict[str, Any]:
        """
        Main entry point for processing a single drug alert.
        Returns complete response with alternatives and communication.
        """
        drug_name = drug_alert_data.get('drug_name', '')
        
        try:
            # Find alternatives for this single drug
            alternatives_result = self.find_and_validate_alternatives([drug_name])
            validated_alternatives = alternatives_result.get(drug_name, [])
            
            # Generate communication
            communication = self.generate_communication_for_doctor(drug_name, validated_alternatives)
            
            # Generate doctor information (this would normally come from a database)
            doctor_info = self._get_doctor_info_for_drug(drug_name)
            
            return {
                'status': 'success',
                'drug_name': drug_name,
                'alert_info': drug_alert_data,
                'suggested_alternatives': validated_alternatives,
                'email_draft': communication,
                'doctor_info': doctor_info,
                'alternatives_found': len(validated_alternatives)
            }
            
        except Exception as e:
            logger.error(f"Error processing drug alert for {drug_name}: {e}")
            return {
                'status': 'error',
                'drug_name': drug_name,
                'error': str(e),
                'suggested_alternatives': [],
                'email_draft': '',
                'doctor_info': self._get_default_doctor_info(),
                'alternatives_found': 0
            }

    def _get_doctor_info_for_drug(self, drug_name: str) -> Dict[str, str]:
        """
        Get prescribing doctor information for a specific drug.
        In a real system, this would query the prescription database.
        """
        # This is mock data - in a real system, you'd query your prescription database
        # to find which doctor prescribed this medication
        mock_doctors = {
            "Lidocaine Hydrochloride Injection": {
                "name": "Dr. Sarah Johnson, MD",
                "specialty": "Anesthesiology",
                "phone": "(555) 123-4567",
                "email": "sjohnson@medicenter.com",
                "hospital": "Central Medical Center"
            },
            "Atorvastatin": {
                "name": "Dr. Michael Chen, MD",
                "specialty": "Cardiology", 
                "phone": "(555) 234-5678",
                "email": "mchen@heartcenter.com",
                "hospital": "Heart & Vascular Institute"
            },
            "Amoxicillin": {
                "name": "Dr. Lisa Rodriguez, MD",
                "specialty": "Internal Medicine",
                "phone": "(555) 345-6789", 
                "email": "lrodriguez@primarycare.com",
                "hospital": "Primary Care Associates"
            }
        }
        
        # Try to find specific doctor for this drug, otherwise return default
        return mock_doctors.get(drug_name, self._get_default_doctor_info())
    
    def _get_default_doctor_info(self) -> Dict[str, str]:
        """
        Default doctor information when specific prescriber is not found.
        """
        return {
            "name": "Dr. Robert Smith, MD",
            "specialty": "General Practice",
            "phone": "(555) 456-7890",
            "email": "rsmith@generalpractice.com", 
            "hospital": "General Medical Group"
        }