"""
AI-Powered Drug Recommendations System
Generates intelligent recommendations for flagged medications
"""

import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class AIRecommendationEngine:
    """
    Generates AI-powered recommendations for pharmacy compliance issues
    """
    
    def __init__(self):
        """Initialize the AI recommendation engine"""
        self.risk_levels = {
            'RED': 'CRITICAL',
            'PURPLE': 'HIGH', 
            'YELLOW': 'MODERATE',
            'BLUE': 'LOW'
        }
        
        self.recall_classifications = {
            'Class I': 'Life-threatening situation - immediate action required',
            'Class II': 'Temporary or reversible health consequences - prompt action needed', 
            'Class III': 'Remote possibility of adverse health consequences - monitor closely'
        }

    def generate_recommendations(
        self,
        drug_name: str,
        alert_level: str,
        status: str = '',
        stock: int = 0,
        days_supply: float = 0,
        reason: str = '',
        classification: str = ''
    ) -> Dict[str, Any]:
        """
        Generate comprehensive AI recommendations for a flagged drug
        
        Args:
            drug_name: Name of the medication
            alert_level: Alert level (RED, PURPLE, YELLOW, BLUE)
            status: FDA status (Recalled, Currently in Shortage, etc.)
            stock: Current stock level
            days_supply: Days of supply remaining
            reason: Reason for recall/shortage
            classification: FDA classification (Class I, II, III)
            
        Returns:
            Dictionary with AI recommendations
        """
        try:
            logger.info(f"Generating AI recommendations for {drug_name} (Alert: {alert_level})")
            
            # Base recommendation structure
            recommendations = {
                'drug_name': drug_name,
                'alert_level': alert_level,
                'risk_assessment': '',
                'immediate_actions': [],
                'alternatives': [],
                'timeline': '',
                'priority_score': self._calculate_priority_score(alert_level, classification, days_supply)
            }
            
            # Generate recommendations based on alert level
            if alert_level == 'RED':
                recommendations = self._generate_critical_recommendations(
                    recommendations, drug_name, status, stock, days_supply, reason, classification
                )
            elif alert_level == 'PURPLE':
                recommendations = self._generate_recall_recommendations(
                    recommendations, drug_name, status, stock, days_supply, reason, classification
                )
            elif alert_level == 'YELLOW':
                recommendations = self._generate_shortage_recommendations(
                    recommendations, drug_name, status, stock, days_supply, reason
                )
            elif alert_level == 'BLUE':
                recommendations = self._generate_monitoring_recommendations(
                    recommendations, drug_name, stock, days_supply
                )
            
            logger.info(f"Successfully generated recommendations for {drug_name}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating AI recommendations for {drug_name}: {e}")
            return self._get_fallback_recommendations(drug_name, alert_level)

    def _calculate_priority_score(self, alert_level: str, classification: str, days_supply: float) -> int:
        """Calculate priority score (1-10, higher = more urgent)"""
        score = 5  # Base score
        
        # Alert level impact
        if alert_level == 'RED':
            score += 3
        elif alert_level == 'PURPLE':
            score += 2
        elif alert_level == 'YELLOW':
            score += 1
            
        # Classification impact
        if classification == 'Class I':
            score += 2
        elif classification == 'Class II':
            score += 1
            
        # Days supply impact
        if days_supply <= 7:
            score += 2
        elif days_supply <= 30:
            score += 1
            
        return min(10, max(1, score))

    def _generate_critical_recommendations(
        self, rec: Dict, drug_name: str, status: str, stock: int, days_supply: float, reason: str, classification: str
    ) -> Dict:
        """Generate recommendations for critical (RED) alerts"""
        
        rec['risk_assessment'] = f"CRITICAL RISK: {drug_name} requires immediate attention due to {status.lower()}. Current supply of {days_supply:.1f} days may impact patient care."
        
        rec['immediate_actions'] = [
            "🚨 STOP dispensing immediately until further review",
            f"📞 Contact all patients who received this medication in the last 30 days",
            "📋 Document all current inventory and lot numbers",
            "🏥 Coordinate with clinical team for patient safety assessment",
            "📧 Report to pharmacy supervisor and compliance officer within 2 hours"
        ]
        
        if 'shortage' in status.lower():
            rec['immediate_actions'].extend([
                "🔍 Search for alternative suppliers immediately",
                "💊 Identify therapeutic alternatives for new prescriptions",
                "📦 Consider emergency drug procurement if clinically critical"
            ])
        
        if classification == 'Class I':
            rec['immediate_actions'].insert(1, "⚠️ This is a Class I recall - life-threatening risk to patients")
        
        rec['alternatives'] = self._get_drug_alternatives(drug_name)
        rec['timeline'] = "IMMEDIATE - All actions must be completed within 2-4 hours"
        
        return rec

    def _generate_recall_recommendations(
        self, rec: Dict, drug_name: str, status: str, stock: int, days_supply: float, reason: str, classification: str
    ) -> Dict:
        """Generate recommendations for recalled (PURPLE) medications"""
        
        classification_desc = self.recall_classifications.get(classification, 'FDA recall')
        rec['risk_assessment'] = f"HIGH RISK: {drug_name} has been recalled by the FDA. {classification_desc}. Current inventory should be quarantined."
        
        rec['immediate_actions'] = [
            "🔒 Quarantine all affected inventory immediately",
            "📋 Check lot numbers against FDA recall notice",
            "🚫 Stop all dispensing of affected lots",
            "📞 Contact patients who received recalled lots (if applicable)",
            "📝 Complete FDA recall response documentation"
        ]
        
        if classification == 'Class I':
            rec['immediate_actions'].extend([
                "🚨 Treat as medical emergency - contact patients within 24 hours",
                "🏥 Coordinate with healthcare providers for patient monitoring"
            ])
        elif classification == 'Class II':
            rec['immediate_actions'].append("📅 Contact affected patients within 48-72 hours")
        
        rec['alternatives'] = self._get_drug_alternatives(drug_name)
        
        if classification == 'Class I':
            rec['timeline'] = "URGENT - Complete within 24 hours for Class I recall"
        else:
            rec['timeline'] = "HIGH PRIORITY - Complete within 48-72 hours"
            
        return rec

    def _generate_shortage_recommendations(
        self, rec: Dict, drug_name: str, status: str, stock: int, days_supply: float, reason: str
    ) -> Dict:
        """Generate recommendations for shortage (YELLOW) situations"""
        
        rec['risk_assessment'] = f"MODERATE RISK: {drug_name} is experiencing supply challenges. Current {days_supply:.1f} day supply requires proactive management."
        
        rec['immediate_actions'] = [
            "📊 Audit current inventory levels and usage patterns",
            "🔍 Contact alternative suppliers for availability",
            "📋 Identify suitable therapeutic alternatives",
            "📞 Notify prescribers of potential supply constraints"
        ]
        
        if days_supply <= 14:
            rec['immediate_actions'].extend([
                "⏰ Implement conservative dispensing (10-14 day supplies)",
                "🚀 Expedite orders from alternative sources"
            ])
        
        if days_supply <= 7:
            rec['immediate_actions'].extend([
                "🚨 Activate emergency procurement procedures",
                "💊 Begin transitioning patients to alternatives"
            ])
        
        rec['alternatives'] = self._get_drug_alternatives(drug_name)
        rec['timeline'] = f"Within 7-10 days (current supply: {days_supply:.1f} days)"
        
        return rec

    def _generate_monitoring_recommendations(
        self, rec: Dict, drug_name: str, stock: int, days_supply: float
    ) -> Dict:
        """Generate recommendations for monitoring (BLUE) situations"""
        
        rec['risk_assessment'] = f"LOW RISK: {drug_name} is showing early warning signs. Proactive monitoring recommended."
        
        rec['immediate_actions'] = [
            "📈 Monitor inventory levels more closely",
            "📊 Review usage trends and reorder points",
            "🔍 Stay updated on FDA announcements for this medication"
        ]
        
        if days_supply <= 30:
            rec['immediate_actions'].append("📦 Consider increasing safety stock levels")
        
        rec['alternatives'] = ["Continue current management - no alternatives needed at this time"]
        rec['timeline'] = "Monitor ongoing - review weekly"
        
        return rec

    def _get_drug_alternatives(self, drug_name: str) -> List[str]:
        """
        Get therapeutic alternatives for a drug
        Note: In a real implementation, this would query a drug database
        """
        # Simplified alternative suggestions based on common drug patterns
        alternatives = []
        
        drug_lower = drug_name.lower()
        
        # Common alternatives for specific drug classes
        if any(term in drug_lower for term in ['acetaminophen', 'tylenol', 'paracetamol']):
            alternatives = [
                "Consider NSAIDs like ibuprofen for pain relief",
                "Consult with prescriber about alternative analgesics",
                "Generic acetaminophen from different manufacturers"
            ]
        elif any(term in drug_lower for term in ['ibuprofen', 'advil', 'motrin']):
            alternatives = [
                "Naproxen (Aleve) for anti-inflammatory effects",
                "Acetaminophen for pain relief (different mechanism)",
                "Consult prescriber about other NSAIDs"
            ]
        elif any(term in drug_lower for term in ['amoxicillin', 'penicillin']):
            alternatives = [
                "Cephalexin (if not penicillin allergic)",
                "Azithromycin for penicillin-allergic patients",
                "Consult prescriber for appropriate alternative antibiotic"
            ]
        elif any(term in drug_lower for term in ['lisinopril', 'ace inhibitor']):
            alternatives = [
                "Consider ARBs (losartan, valsartan)",
                "Other ACE inhibitors (enalapril, ramipril)",
                "Consult prescriber about therapeutic alternatives"
            ]
        else:
            # Generic alternatives
            alternatives = [
                "Contact prescriber to discuss therapeutic alternatives",
                "Check for generic versions from different manufacturers",
                "Consider similar medications in the same therapeutic class",
                "Consult clinical pharmacist for alternative recommendations"
            ]
        
        return alternatives[:4]  # Limit to 4 alternatives

    def _get_fallback_recommendations(self, drug_name: str, alert_level: str) -> Dict[str, Any]:
        """Fallback recommendations when AI generation fails"""
        return {
            'drug_name': drug_name,
            'alert_level': alert_level,
            'risk_assessment': f"Unable to generate detailed risk assessment for {drug_name}. Manual review required.",
            'immediate_actions': [
                "Review drug status manually with pharmacy supervisor",
                "Check FDA databases for latest information",
                "Consult clinical pharmacist for guidance",
                "Document review and decisions made"
            ],
            'alternatives': [
                "Consult prescriber about alternative medications",
                "Contact clinical pharmacist for therapeutic alternatives"
            ],
            'timeline': "Within 24 hours - manual review required",
            'priority_score': 5
        }
