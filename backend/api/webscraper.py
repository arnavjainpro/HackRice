import pandas as pd
import requests
from bs4 import BeautifulSoup
from io import StringIO


def scrape_fda_shortages_as_dataframe() -> pd.DataFrame:
    """
    Scrapes the FDA drug shortage website and returns the main data as a pandas DataFrame.
    
    Returns:
        pd.DataFrame: DataFrame with columns 'generic_name' and 'status'
    """
    
    url = "https://www.accessdata.fda.gov/scripts/drugshortages/default.cfm"
    
    try:
        # Set up headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        # Fetch the HTML content
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parse the data from the HTML
        drug_data = parse_table_data(response.text)
        
        # Create DataFrame from extracted data
        if drug_data:
            df = pd.DataFrame(drug_data)
            
            # Clean the data
            df['generic_name'] = df['generic_name'].str.strip()
            df['status'] = df['status'].str.strip()
            
            # Remove duplicates
            df = df.drop_duplicates()
            
            return df
        else:
            print("Warning: No drug shortage data found on the webpage.")
            return pd.DataFrame(columns=['generic_name', 'status'])
            
    except requests.exceptions.RequestException as e:
        print(f"Network error occurred while fetching FDA drug shortage data: {e}")
        return pd.DataFrame(columns=['generic_name', 'status'])
        
    except Exception as e:
        print(f"Error occurred while scraping FDA drug shortage data: {e}")
        return pd.DataFrame(columns=['generic_name', 'status'])


def parse_table_data(html_content: str) -> list:
    """
    Parse the HTML content to extract drug data from tables.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        List of dictionaries with drug data
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    drug_data = []
    
    # Method 1: Try pandas read_html for automatic table detection
    try:
        # Use StringIO to avoid the FutureWarning
        tables = pd.read_html(StringIO(html_content))
        
        for table in tables:
            # Look for tables with drug shortage data
            if len(table.columns) >= 2:
                # Table with both name and status columns
                for _, row in table.iterrows():
                    drug_name = None
                    status = None
                    
                    # Find the generic name and status columns
                    for col in table.columns:
                        col_str = str(col).lower()
                        if 'generic' in col_str or 'name' in col_str or 'ingredient' in col_str:
                            drug_name = row[col]
                        elif 'status' in col_str:
                            status = row[col]
                    
                    if drug_name and status and pd.notna(drug_name) and pd.notna(status):
                        drug_data.append({
                            'generic_name': str(drug_name),
                            'status': str(status)
                        })
                        
            elif len(table.columns) == 1:
                # Table with only drug names (assume discontinuation)
                for _, row in table.iterrows():
                    for col in table.columns:
                        col_str = str(col).lower()
                        if 'generic' in col_str or 'name' in col_str or 'ingredient' in col_str:
                            drug_name = row[col]
                            if pd.notna(drug_name):
                                drug_data.append({
                                    'generic_name': str(drug_name),
                                    'status': 'Discontinuation'
                                })
                            break
                            
    except Exception as e:
        print(f"pandas read_html failed: {e}")
        
        # Method 2: Manual HTML table parsing as backup
        try:
            tables = soup.find_all('table')
            
            for table in tables:
                rows = table.find_all('tr')
                if len(rows) < 2:  # Need at least header + 1 data row
                    continue
                
                # Find header row to identify columns
                header_row = rows[0]
                headers = [th.get_text(strip=True).lower() for th in header_row.find_all(['th', 'td'])]
                
                # Find column indices
                name_col = None
                status_col = None
                
                for i, header in enumerate(headers):
                    if 'generic' in header or 'name' in header or 'ingredient' in header:
                        name_col = i
                    elif 'status' in header:
                        status_col = i
                
                if name_col is not None and status_col is not None:
                    # Extract data rows with both name and status
                    for row in rows[1:]:  # Skip header
                        cells = row.find_all(['td', 'th'])
                        if len(cells) > max(name_col, status_col):
                            drug_name = cells[name_col].get_text(strip=True)
                            status = cells[status_col].get_text(strip=True)
                            
                            if drug_name and status:
                                drug_data.append({
                                    'generic_name': drug_name,
                                    'status': status
                                })
                                
                elif name_col is not None:
                    # Handle tables with only drug names (assume discontinuation)
                    for row in rows[1:]:  # Skip header
                        cells = row.find_all(['td', 'th'])
                        if len(cells) > name_col:
                            drug_name = cells[name_col].get_text(strip=True)
                            if drug_name:
                                drug_data.append({
                                    'generic_name': drug_name,
                                    'status': 'Discontinuation'
                                })
                                
        except Exception as e:
            print(f"Manual table parsing failed: {e}")
    
    return drug_data


# Example usage and testing
if __name__ == "__main__":
    # Test the function
    df = scrape_fda_shortages_as_dataframe()
    print(f"Scraped {len(df)} drug shortage records")
    print("\nFirst 10 records:")
    print(df.head(10))
    print("\nUnique status values:")
    print(df['status'].value_counts())
    
    # Show summary statistics
    print(f"\nDataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")