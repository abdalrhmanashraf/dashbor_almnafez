import json
import os
import random
from datetime import datetime

import pandas as pd

# Constants
API_URL = os.getenv("APPS_SCRIPT_URL", "")  # URL from Google Apps Script
TOKEN = "secure-token-123"

# File Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

DATA_FILE = os.path.join(DATA_DIR, 'data.json')
KPIS_FILE = os.path.join(DATA_DIR, 'kpis.json')
ALERTS_FILE = os.path.join(DATA_DIR, 'alerts.json')
POPULATION_FILE = os.path.join(DATA_DIR, 'population.json')

def generate_mock_data():
    """Generate mock data if API URL is not set."""
    print("Generating mock data...")
    months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو']
    regions = ['الأقصر', 'ارمنت', 'اسنا', 'القرنة', 'الفرع الرئيسي']
    centers = {
        'الأقصر': ['منفذ الأقصر 1', 'منفذ الأقصر 2'],
        'ارمنت': ['منفذ ارمنت الرئيسي', 'منفذ ارمنت الفرعي'],
        'اسنا': ['منفذ اسنا 1'],
        'القرنة': ['منفذ القرنة'],
        'الفرع الرئيسي': ['الفرع الرئيسي']
    }
    
    data = []
    for month in months:
        for region in regions:
            for center in centers[region]:
                # Simulate some realistic numbers with random variations
                beneficiaries = random.randint(1000, 5000)
                updates = random.randint(100, 500)
                collections = random.randint(10000, 50000)
                
                row = {
                    "الشهر": month,
                    "المنطقة": region,
                    "المنفذ": center,
                    "ملف اسري": random.randint(500, 2000),
                    "جديد": random.randint(50, 200),
                    "تحديث": updates,
                    "بدل فاقد": random.randint(10, 50),
                    "تغيير وحدة": random.randint(5, 20),
                    "إصدار بطاقات": random.randint(100, 400),
                    "إجمالي مستفيدين": beneficiaries,
                    "إضافة": random.randint(20, 100),
                    "حذف": random.randint(5, 30),
                    "فصل": random.randint(1, 10),
                    "مترددين": random.randint(200, 1000),
                    "مغتربين": random.randint(10, 50),
                    "خطابات إحالة": random.randint(50, 200),
                    "سداد نقدي": collections * 0.8,
                    "مسجلين أفراد": random.randint(200, 800),
                    "مسجلين أسر": random.randint(100, 400),
                    "مؤمن عليه": int(beneficiaries * 0.6),
                    "غير مؤمن عليه": int(beneficiaries * 0.1),
                    "موظف حكومي": int(beneficiaries * 0.15),
                    "بالمعاش": int(beneficiaries * 0.05),
                    "تكافل وكرامة": int(beneficiaries * 0.1),
                    "إجمالي تحصيل": collections,
                    "إجمالي رسوم": collections * 0.1,
                    "إجمالي سداد": collections * 1.1
                }
                data.append(row)
    return data

def generate_mock_population_data():
    """Generate mock population data for sheet 2."""
    regions = ['الأقصر', 'ارمنت', 'اسنا', 'القرنة', 'الفرع الرئيسي']
    centers = {
        'الأقصر': ['منفذ الأقصر 1', 'منفذ الأقصر 2'],
        'ارمنت': ['منفذ ارمنت الرئيسي', 'منفذ ارمنت الفرعي'],
        'اسنا': ['منفذ اسنا 1'],
        'القرنة': ['منفذ القرنة'],
        'الفرع الرئيسي': ['الفرع الرئيسي']
    }
    pop_data = []
    for region in regions:
        for center in centers[region]:
            registered = random.randint(15000, 35000)
            unregistered = random.randint(3000, 10000)
            pop_data.append({
                "المنطقة": region,
                "إسم الوحدة / المركز": center,
                "عدد المسجلين": registered,
                "عدد الغير مسجلين": unregistered,
                "إجمالي عدد السكان لكل مركز أسرة و وحدة صحية": registered + unregistered
            })
    return pop_data

# URL for the public Google Sheet export (Excel format)
GSHEET_EXPORT_URL = "https://docs.google.com/spreadsheets/d/12tWeZXJSyrO9j8SzhduSMqH9hC4aBs46cAK9RNNc14E/export?format=xlsx"

def fetch_data_from_gsheet():
    """Fetch data directly from the public Google Sheet export."""
    try:
        import requests
        import io
        response = requests.get(GSHEET_EXPORT_URL)
        response.raise_for_status()
        
        # Read the excel file from memory
        xls = pd.ExcelFile(io.BytesIO(response.content))
        
        # Sheet 1: Main Data
        df1 = pd.read_excel(xls, sheet_name=xls.sheet_names[0])
        
        # Rename columns to match expected dashboard schema
        rename_map = {
            "اجمالي مستفيدين": "إجمالي مستفيدين",
            "اجمالي التحصيل": "إجمالي تحصيل",
            "اجمالي الرسوم": "إجمالي رسوم",
            "اجمالي السداد": "إجمالي سداد",
            "تكافل وكرامه": "تكافل وكرامة",
            "اضافه": "إضافة",
            "اصدار بطاقات": "إصدار بطاقات",
            "تغيير وحده ( نقل )": "تغيير وحدة",
            "عدد بدل الفاقد": "بدل فاقد"
        }
        df1 = df1.rename(columns=rename_map)
        
        # Sheet 2: Population Data
        df2 = pd.read_excel(xls, sheet_name=xls.sheet_names[1])
        
        # Convert to list of dicts and handle NaNs
        data_sheet1 = df1.fillna(0).to_dict('records')
        data_sheet2 = df2.fillna(0).to_dict('records')
        
        return data_sheet1, data_sheet2
        
    except Exception as e:
        print(f"Failed to fetch data directly from Google Sheet: {e}")
        return generate_mock_data(), generate_mock_population_data()

def analyze_data(data):
    """Analyze data using Pandas and generate KPIs and Alerts."""
    df = pd.DataFrame(data)
    
    # Ensure numeric columns are actually numeric
    numeric_cols = [col for col in df.columns if col not in ['الشهر', 'المنطقة', 'المنفذ']]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # 1. Monthly Growth (pct_change) per center
    # We need to map months to numbers to sort them chronologically if they are Arabic names
    month_map = {'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'أغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12}
    df['Month_Num'] = df['الشهر'].map(month_map)
    df = df.sort_values(by=['المنفذ', 'Month_Num'])
    
    # Calculate pct change for beneficiaries
    df['pct_change_beneficiaries'] = df.groupby('المنفذ')['إجمالي مستفيدين'].pct_change() * 100
    df['pct_change_beneficiaries'] = df['pct_change_beneficiaries'].fillna(0).round(2)

    # 2. Anomaly Detection (Performance drop > 20% suddenly)
    alerts = []
    anomalies = df[df['pct_change_beneficiaries'] < -20.0]
    for _, row in anomalies.iterrows():
        alerts.append({
            "type": "anomaly",
            "center": row['المنفذ'],
            "month": row['الشهر'],
            "metric": "إجمالي مستفيدين",
            "drop": f"{row['pct_change_beneficiaries']}%",
            "message": f"انخفاض حاد في أداء {row['المنفذ']} خلال شهر {row['الشهر']} بنسبة {row['pct_change_beneficiaries']}%"
        })

    # 3. Composite KPI: (beneficiaries * 0.4) + (collections * 0.3) + (updates * 0.3)
    # Normalize data first to avoid large numbers dominating (Min-Max Scaling)
    def min_max_scale(series):
        return (series - series.min()) / (series.max() - series.min() + 1e-9)

    df['norm_beneficiaries'] = min_max_scale(df['إجمالي مستفيدين'])
    df['norm_collections'] = min_max_scale(df['إجمالي تحصيل'])
    df['norm_updates'] = min_max_scale(df['تحديث'])
    
    df['kpi_score'] = (df['norm_beneficiaries'] * 0.4) + (df['norm_collections'] * 0.3) + (df['norm_updates'] * 0.3)
    df['kpi_score'] = (df['kpi_score'] * 100).round(2) # Convert to 0-100 scale
    
    # Overall summary for top KPIs (Latest Month)
    latest_month_num = df['Month_Num'].max()
    latest_data = df[df['Month_Num'] == latest_month_num]
    previous_data = df[df['Month_Num'] == latest_month_num - 1] if latest_month_num > 1 else pd.DataFrame()

    total_beneficiaries = float(latest_data['إجمالي مستفيدين'].sum())
    total_collections = float(latest_data['إجمالي تحصيل'].sum())
    total_updates = float(latest_data['تحديث'].sum())
    total_new = float(latest_data['جديد'].sum())
    total_files = float(latest_data['ملف اسري'].sum())

    def calc_growth(current, previous):
        if previous == 0: return 0
        return round(((current - previous) / previous) * 100, 2)

    prev_total_beneficiaries = float(previous_data['إجمالي مستفيدين'].sum()) if not previous_data.empty else total_beneficiaries
    prev_total_collections = float(previous_data['إجمالي تحصيل'].sum()) if not previous_data.empty else total_collections
    prev_total_updates = float(previous_data['تحديث'].sum()) if not previous_data.empty else total_updates
    prev_total_new = float(previous_data['جديد'].sum()) if not previous_data.empty else total_new
    prev_total_files = float(previous_data['ملف اسري'].sum()) if not previous_data.empty else total_files

    kpis = {
        "summary": {
            "beneficiaries": {"value": total_beneficiaries, "growth": calc_growth(total_beneficiaries, prev_total_beneficiaries)},
            "collections": {"value": total_collections, "growth": calc_growth(total_collections, prev_total_collections)},
            "updates": {"value": total_updates, "growth": calc_growth(total_updates, prev_total_updates)},
            "new_members": {"value": total_new, "growth": calc_growth(total_new, prev_total_new)},
            "family_files": {"value": total_files, "growth": calc_growth(total_files, prev_total_files)}
        },
        "top_centers": latest_data.sort_values(by='kpi_score', ascending=False)[['المنفذ', 'kpi_score', 'إجمالي مستفيدين', 'إجمالي تحصيل']].head(5).to_dict('records')
    }

    # Data Quality Alerts
    missing_data = df.isnull().sum().sum()
    if missing_data > 0:
        alerts.append({
            "type": "warning",
            "message": f"تحذير: يوجد بيانات مفقودة ({missing_data} حقل)"
        })

    # Drop temporary columns for final JSON output
    df = df.drop(columns=['Month_Num', 'norm_beneficiaries', 'norm_collections', 'norm_updates'])

    return df.to_dict('records'), kpis, alerts

def main():
    print(f"[{datetime.now()}] Starting data fetch and analysis...")
    raw_data, pop_data = fetch_data_from_gsheet()
    
    if not raw_data:
        print("No data fetched.")
        return

    processed_data, kpis, alerts = analyze_data(raw_data)
    
    # Process population data (clean up)
    pop_df = pd.DataFrame(pop_data)
    for col in ["عدد المسجلين", "عدد الغير مسجلين", "إجمالي عدد السكان لكل مركز أسرة و وحدة صحية"]:
        if col in pop_df.columns:
            pop_df[col] = pd.to_numeric(pop_df[col], errors='coerce').fillna(0)
    
    # Add coverage percentage
    if not pop_df.empty:
        pop_df['نسبة التغطية'] = (pop_df['عدد المسجلين'] / pop_df['إجمالي عدد السكان لكل مركز أسرة و وحدة صحية']) * 100
        pop_df['نسبة التغطية'] = pop_df['نسبة التغطية'].fillna(0).round(2)
        clean_pop_data = pop_df.to_dict('records')
    else:
        clean_pop_data = []

    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)
        
    with open(KPIS_FILE, 'w', encoding='utf-8') as f:
        json.dump(kpis, f, ensure_ascii=False, indent=2)

    with open(ALERTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(alerts, f, ensure_ascii=False, indent=2)

    with open(POPULATION_FILE, 'w', encoding='utf-8') as f:
        json.dump(clean_pop_data, f, ensure_ascii=False, indent=2)

    print(f"[{datetime.now()}] Data processing complete. Files saved to data/ directory.")

if __name__ == "__main__":
    main()
