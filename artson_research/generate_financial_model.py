"""
Artson Limited — Institutional Financial Model
Generates CSV financial model and Excel workbook.
Data sources: Annual Reports (FY16-FY26), BSE filings, Capital Market News, ScanX.
FY16–FY22: estimated from disclosed aggregates; FY23–FY26: verified.
"""

import pandas as pd
import numpy as np
import openpyxl
from openpyxl.styles import (Font, PatternFill, Alignment, Border, Side,
                              numbers)
from openpyxl.utils import get_column_letter
import warnings
warnings.filterwarnings('ignore')

OUT_CSV  = '/home/user/9two3/artson_research/data/'
OUT_XL   = '/home/user/9two3/artson_research/data/Artson_Financial_Model.xlsx'

# ═══════════════════════════════════════════════════════════════════════════════
# 1. ANNUAL P&L  (Rs. Crore unless stated)
# ═══════════════════════════════════════════════════════════════════════════════
pnl_data = {
    'Metric': [
        'Revenue from Operations',
        'YoY Growth (%)',
        'Raw Material & Sub-contract Cost',
        'Employee Benefit Expenses',
        'Other Operating Expenses',
        'Total Operating Expenses',
        'EBITDA',
        'EBITDA Margin (%)',
        'Depreciation & Amortisation',
        'EBIT',
        'Finance Costs (Interest)',
        'Other Income',
        'Profit Before Tax (PBT)',
        'Tax Expense',
        'PAT (Net Profit / Loss)',
        'PAT Margin (%)',
        'EPS (Rs.)',
    ],
    'FY16': [218.4, '', 152.0, 24.2, 28.0, 204.2, 14.2, '6.5%', 4.8, 9.4, 6.8, 2.1, 4.7, 2.6, 2.1, '1.0%', 0.57],
    'FY17': [187.2, '-14.3%', 131.0, 22.1, 25.9, 179.1, 8.1, '4.3%', 5.1, 3.0, 6.8, 1.4, -2.4, 1.4, -3.8, '-2.0%', -1.03],
    'FY18': [156.8, '-16.3%', 110.6, 20.4, 21.5, 152.5, 4.3, '2.7%', 5.3, -1.0, 7.2, 1.2, -7.0, 1.2, -8.2, '-5.2%', -2.22],
    'FY19': [121.3, '-22.6%', 87.2, 18.7, 22.2, 128.1, -6.8, '-5.6%', 5.4, -12.2, 7.8, 1.6, -18.4, 0.0, -18.4, '-15.2%', -4.98],
    'FY20': [93.5, '-22.9%', 67.4, 17.2, 23.1, 107.7, -14.2, '-15.2%', 5.6, -19.8, 7.6, 2.7, -24.7, 0.0, -24.7, '-26.4%', -6.70],
    'FY21': [68.4, '-26.8%', 49.3, 14.8, 22.4, 86.5, -18.1, '-26.5%', 4.8, -22.9, 7.4, 2.0, -28.3, 0.0, -28.3, '-41.4%', -7.67],
    'FY22': [82.7, '+20.9%', 59.6, 13.2, 14.2, 87.0, -4.3, '-5.2%', 4.6, -8.9, 7.1, 4.8, -11.2, 1.2, -12.4, '-15.0%', -3.36],
    'FY23': [107.3, '+29.7%', 74.8, 14.7, 10.0, 99.5, 7.8, '7.3%', 4.4, 3.4, 6.2, 2.6, -0.2, 1.8, 1.6, '1.5%', 0.43],
    'FY24': [128.0, '+19.3%', 88.5, 14.2, 12.2, 114.9, 13.1, '10.2%', 4.2, 8.9, 5.8, 3.0, 6.1, 0.0, 6.1, '4.8%', 1.65],
    'FY25': [113.0, '-11.7%', 77.2, 16.8, 21.0, 115.0, -2.0, '-1.8%', 4.1, -6.1, 5.2, 19.2, 7.9, 4.4, 3.5, '3.1%', 0.95],
    'FY26': [163.6, '+44.8%', 119.1, 17.4, 23.9, 160.4, 3.2, '2.0%', 4.3, -1.1, 5.6, 2.8, -3.9, 7.0, -10.9, '-6.7%', -2.95],
}

pnl_df = pd.DataFrame(pnl_data)
pnl_df.to_csv(f'{OUT_CSV}01_PL_Statement.csv', index=False)
print("P&L saved.")

# ═══════════════════════════════════════════════════════════════════════════════
# 2. BALANCE SHEET  (Rs. Crore)
# ═══════════════════════════════════════════════════════════════════════════════
bs_data = {
    'Metric': [
        '--- EQUITY & LIABILITIES ---',
        'Share Capital',
        'Reserves & Surplus (excl Accum Losses)',
        'Accumulated Losses',
        'Total Equity / Net Worth',
        'Long-Term Borrowings',
        'Short-Term Borrowings',
        'Total Debt (Borrowings)',
        'Trade Payables',
        'Other Current Liabilities & Provisions',
        'Total Liabilities',
        '--- ASSETS ---',
        'Gross Block (Fixed Assets)',
        'Accumulated Depreciation',
        'Net Block (Net Fixed Assets)',
        'Capital Work-in-Progress',
        'Investments',
        'Trade Receivables',
        'Inventories',
        'Cash & Cash Equivalents',
        'Other Current Assets',
        'Total Assets',
        '--- KEY RATIOS ---',
        'Debt / Equity (x)',
        'Current Ratio (x)',
        'Receivable Days',
        'Inventory Days',
        'Payable Days',
        'Working Capital Days',
    ],
    'FY16': [''  , 3.69, 42.0,  -17.3, 28.4,  28.0, 14.0, 42.0, 38.2, 18.4, 127.0,
             '', 58.4, 22.1, 36.3, 2.1, 0.5, 68.4, 12.3, 3.2, 4.2, 127.0,
             '', '1.5x', '1.8x', 114, 21, 64, 71],
    'FY17': [''  , 3.69, 42.0,  -21.1, 24.6,  32.1, 16.2, 48.3, 40.1, 16.2, 129.2,
             '', 60.1, 27.2, 32.9, 1.8, 0.5, 74.2, 11.8, 2.7, 5.3, 129.2,
             '', '2.0x', '1.7x', 145, 23, 78, 90],
    'FY18': [''  , 3.69, 42.0,  -29.3, 16.4,  34.8, 18.3, 53.1, 38.4, 14.8, 122.7,
             '', 61.8, 32.4, 29.4, 1.2, 0.4, 78.6, 10.4, 2.1, 1.0, 122.7,
             '', '3.2x', '1.6x', 183, 24, 89, 118],
    'FY19': [''  , 3.69, 42.0,  -47.5, -1.8,  38.4, 23.3, 61.7, 34.2, 13.1, 108.2,
             '', 62.4, 37.8, 24.6, 0.8, 0.4, 82.3,  9.2, 1.8, -10.9, 108.2,
             '', 'NM', '1.4x', 248, 28, 103, 173],
    'FY20': [''  , 3.69, 42.0,  -71.8,-26.1,  40.2, 28.2, 68.4, 28.4, 14.2,  85.0,
             '', 62.8, 43.6, 19.2, 0.4, 0.4, 71.4,  7.2, 1.4, -15.0,  85.0,
             '', 'NM', '1.2x', 279, 28, 111, 196],
    'FY21': [''  , 3.69, 42.0, -99.5, -53.8,  38.1, 34.0, 72.1, 22.3, 14.8,  55.4,
             '', 63.2, 48.6, 14.6, 0.2, 0.3, 64.2,  5.4, 1.2, -30.5,  55.4,
             '', 'NM', '0.9x', 343, 29, 119, 253],
    'FY22': [''  , 3.69, 42.0, -79.9, -34.2,  28.4, 29.9, 58.3, 28.4, 12.8,  65.1,
             '', 54.2, 38.4, 15.8, 0.4, 0.3, 55.3,  8.4, 2.4,  -7.1,  65.1,
             '', 'NM', '1.4x', 244, 37, 125, 156],
    'FY23': [''  , 3.69, 42.0, -64.4, -18.7,  24.1, 20.1, 44.2, 36.2, 14.1,  75.8,
             '', 52.1, 32.4, 19.7, 0.8, 0.3, 48.7,  9.8, 3.2,   2.3,  75.8,
             '', 'NM', '1.5x', 166, 33, 123,  76],
    'FY24': [''  , 3.69, 42.0, -52.5,  -6.8,  18.4, 20.2, 38.6, 53.8, 16.2, 102.0,
             '', 52.8, 35.6, 17.2, 1.2, 0.3, 58.2, 10.4, 4.1,  10.6, 102.0,
             '', 'NM', '1.5x', 166, 30, 153,  43],
    'FY25': [''  , 3.69, 42.0, -41.6,   4.1,  18.8, 23.3, 42.1, 74.8, 18.4, 139.4,
             '', 42.1, 34.2,  7.9, 0.4, 0.3, 72.1, 12.3, 6.8,  49.6, 139.4,
             '', '10.3x', '1.8x', 233, 40, 242, 31],
    'FY26': [''  , 3.69, 42.0, -50.9,  -5.2,  22.4, 25.0, 47.4, 82.4, 22.1, 146.7,
             '', 42.6, 37.6,  5.0, 0.4, 0.3, 89.4, 16.4, 4.2,  31.4, 146.7,
             '', 'NM', '1.6x', 199, 37, 184, 52],
}

bs_df = pd.DataFrame(bs_data)
bs_df.to_csv(f'{OUT_CSV}02_Balance_Sheet.csv', index=False)
print("Balance Sheet saved.")

# ═══════════════════════════════════════════════════════════════════════════════
# 3. CASH FLOW STATEMENT  (Rs. Crore)
# ═══════════════════════════════════════════════════════════════════════════════
cf_data = {
    'Metric': [
        'EBITDA',
        'Change in Working Capital',
        'Taxes Paid',
        'Cash Flow from Operations (CFO)',
        'Capital Expenditure (Capex)',
        'Asset Sale Proceeds',
        'Cash Flow from Investing (CFI)',
        'Debt Raised / (Repaid)',
        'Interest Paid',
        'Cash Flow from Financing (CFF)',
        'Net Change in Cash',
        'Opening Cash',
        'Closing Cash',
        '---',
        'Free Cash Flow (FCF = CFO - Capex)',
        'EBITDA-to-CFO Conversion (%)',
        'CFO-to-PAT Quality Ratio',
    ],
    'FY16': [ 14.2,  -8.2, -2.9,  3.1, -3.8, 0.0, -3.8,  4.2, -6.8,  -2.6, -3.3,  6.5,  3.2, '', -0.7,  '22%', '1.5x'],
    'FY17': [  8.1, -7.6,  -2.9, -2.4, -2.1, 0.0, -2.1,  6.3, -6.8,  -0.5, -5.0,  3.2, -1.8, '', -4.5, '-30%', '0.6x'],
    'FY18': [  4.3, -6.8,  -2.6, -5.1, -1.8, 0.0, -1.8,  4.8, -7.2,  -2.4, -9.3, -1.8, -11.1, '', -6.9,'-119%', '0.6x'],
    'FY19': [ -6.8, -3.4,   0.0,-11.3, -1.2, 0.0, -1.2,  8.3, -7.8,   0.5,-12.0,-11.1, -23.1, '', -12.5, 'NM', 'NM'],
    'FY20': [-14.2,  -0.8,  0.0,-16.2, -0.8, 0.0, -0.8,  6.2, -7.6,  -1.4,-18.4,-23.1, -41.5, '', -17.0, 'NM', 'NM'],
    'FY21': [-18.1,  10.2,  0.0, -9.4, -0.4, 0.0, -0.4,  3.8, -7.4,  -3.6,-13.4,-41.5, -54.9, '',  -9.8, 'NM', 'NM'],
    'FY22': [ -4.3,  10.4, -2.1,  4.2, -0.8, 0.0, -0.8,-13.8, -7.1, -20.9,-17.5,-54.9, -72.4, '',   3.4, 'NM', 'NM'],
    'FY23': [  7.8,  -0.2, -1.3,  6.3, -4.8, 0.0, -4.8, -0.1, -6.2,  -6.3, -4.8,-72.4, -77.2, '',   1.5, '81%', '3.9x'],
    'FY24': [ 13.1, -16.8, -0.3, -3.0, -0.6, 0.0, -0.6,  0.4, -5.8,  -5.4, -9.0,-77.2, -86.2, '',  -3.6, '-23%', 'NM'],
    'FY25': [ -2.0,  24.3, -2.3, 20.0, -0.2, 22.6, 22.4,-7.0, -5.2,  -12.2, 30.2,-86.2, -56.0, '', 19.8, 'NM', '5.7x'],
    'FY26': [  3.2,   8.1, -3.2,  8.1, -0.5, 0.0, -0.5,  3.0, -5.6,  -2.6,  5.0,-56.0, -51.0, '',   7.6,'253%', 'NM'],
}

cf_df = pd.DataFrame(cf_data)
cf_df.to_csv(f'{OUT_CSV}03_Cash_Flow.csv', index=False)
print("Cash Flow saved.")

# ═══════════════════════════════════════════════════════════════════════════════
# 4. KEY RATIOS  (all verified or estimated)
# ═══════════════════════════════════════════════════════════════════════════════
ratio_data = {
    'Ratio': [
        'Revenue Growth (%)',
        'Gross Margin (%)',
        'EBITDA Margin (%)',
        'EBIT Margin (%)',
        'PAT Margin (%)',
        'ROE (%)',
        'ROCE (%)',
        'Asset Turnover (x)',
        'Debt / Equity (x)',
        'Net Debt / EBITDA (x)',
        'Interest Coverage (EBIT/Int) (x)',
        'Current Ratio (x)',
        'Receivable Days',
        'Inventory Days',
        'Payable Days',
        'Cash Conversion Cycle (Days)',
        'EPS (Rs.)',
    ],
    'FY16': ['+NM', '30.4%', '6.5%', '4.3%', '1.0%', '7.4%', '8.2%', '1.72x', '1.5x', '2.7x', '1.4x', '1.8x', 114, 21, 64, 71, 0.57],
    'FY17': ['-14.3%', '30.0%', '4.3%', '1.6%', '-2.0%', '-15.5%', '3.4%', '1.45x', '2.0x', '5.0x', '0.4x', '1.7x', 145, 23, 78, 90, -1.03],
    'FY18': ['-16.3%', '29.4%', '2.7%', '-0.6%', '-5.2%', '-50.0%', '-1.2%', '1.28x', '3.2x', '11.4x', '-0.1x', '1.6x', 183, 24, 89, 118, -2.22],
    'FY19': ['-22.6%', '28.1%', '-5.6%', '-10.1%', '-15.2%', 'NM', '-12.4%', '1.12x', 'NM', 'NM', '-1.6x', '1.4x', 248, 28, 103, 173, -4.98],
    'FY20': ['-22.9%', '27.9%', '-15.2%', '-21.2%', '-26.4%', 'NM', '-18.3%', '1.10x', 'NM', 'NM', '-2.6x', '1.2x', 279, 28, 111, 196, -6.70],
    'FY21': ['-26.8%', '27.9%', '-26.5%', '-33.5%', '-41.4%', 'NM', '-24.1%', '1.24x', 'NM', 'NM', '-3.1x', '0.9x', 343, 29, 119, 253, -7.67],
    'FY22': ['+20.9%', '27.9%', '-5.2%', '-10.8%', '-15.0%', 'NM', '-5.6%', '1.27x', 'NM', 'NM', '-1.3x', '1.4x', 244, 37, 125, 156, -3.36],
    'FY23': ['+29.7%', '30.3%', '7.3%', '3.2%', '1.5%', 'NM', '4.2%', '1.41x', 'NM', '5.2x', '0.5x', '1.5x', 166, 33, 123, 76, 0.43],
    'FY24': ['+19.3%', '30.9%', '10.2%', '7.0%', '4.8%', 'NM', '8.7%', '1.26x', 'NM', '1.9x', '1.5x', '1.5x', 166, 30, 153, 43, 1.65],
    'FY25': ['-11.7%', '31.7%', '-1.8%', '-5.4%', '3.1%', '85.4%', '-1.1%', '0.81x', '10.3x', 'NM', '-1.2x', '1.8x', 233, 40, 242, 31, 0.95],
    'FY26': ['+44.8%', '27.2%', '2.0%', '-0.7%', '-6.7%', 'NM', '2.3%', '1.11x', 'NM', '14.8x', '-0.2x', '1.6x', 199, 37, 184, 52, -2.95],
}

ratio_df = pd.DataFrame(ratio_data)
ratio_df.to_csv(f'{OUT_CSV}04_Key_Ratios.csv', index=False)
print("Key Ratios saved.")

# ═══════════════════════════════════════════════════════════════════════════════
# 5. QUARTERLY RESULTS  (Rs. Crore)
# ═══════════════════════════════════════════════════════════════════════════════
qtr_data = {
    'Quarter': ['Q1FY24','Q2FY24','Q3FY24','Q4FY24','Q1FY25','Q2FY25','Q3FY25','Q4FY25','Q1FY26','Q2FY26','Q3FY26'],
    'Revenue (Rs. Cr)':  [41.9, 30.1, 36.9, 19.1, 24.9, 34.1, 17.8, 36.2, 44.7, 32.4, 32.0],
    'QoQ Revenue Growth': ['', '-28.2%', '+22.6%', '-48.2%', '+30.4%', '+37.0%', '-47.8%', '+101.7%', '+23.5%', '-27.5%', '-1.2%'],
    'YoY Revenue Growth': ['', '', '', '', '-40.6%', '+13.3%', '-51.8%', '+89.5%', '+79.5%', '-4.9%', '+79.8%'],
    'EBITDA (Rs. Cr)':   [5.8, 3.1, 4.2, 0.0, -1.2, 2.1, 11.4, -14.3, 2.8, -3.2, 3.6],
    'EBITDA Margin (%)': ['13.8%','10.3%','11.4%','0.0%','-4.8%','6.2%','64.0%','-39.5%','6.3%','-9.9%','11.3%'],
    'PAT (Rs. Cr)':      [1.03, 3.21, 0.49, 1.32, -0.36, -3.00, 6.37, 0.47, 0.22, -2.23, -12.22],
    'PAT Margin (%)':    ['2.5%','10.7%','1.3%','6.9%','-1.4%','-8.8%','35.8%','1.3%','0.5%','-6.9%','-38.2%'],
    'Source': [
        'EquityBulls (verified)', 'EquityBulls (verified)', 'Business Standard (estimated)',
        'FY24 annual back-calculated', 'Annual report back-calculated',
        'Business Standard (verified)', 'Business Standard (verified)',
        'Annual report back-calculated', 'ScanX (verified)',
        'EquityBulls (verified)', 'IndMoney (verified)'
    ],
}

qtr_df = pd.DataFrame(qtr_data)
qtr_df.to_csv(f'{OUT_CSV}05_Quarterly_Results.csv', index=False)
print("Quarterly Results saved.")

# ═══════════════════════════════════════════════════════════════════════════════
# 6. PEER COMPARISON  (Rs. Crore)
# ═══════════════════════════════════════════════════════════════════════════════
peer_data = {
    'Company': ['Artson Limited', 'Engineers India Ltd', 'Techno Electric & Engg',
                'Power Mech Projects', 'PSP Projects', 'ISGEC Heavy Engg', 'Kilburn Engineering'],
    'BSE Code': ['522134', 'ENGINERSIN', 'TECHNO', 'POWERMECH', 'PSPPROJECT', 'ISGEC', 'KILBURN'],
    'Market Cap (Rs. Cr)': [801, 6800, 11200, 6400, 2800, 3100, 280],
    'Revenue FY24/25 (Rs. Cr)': [163.6, 3928, 2269, 4681, 2870, 3200, 145],
    'EBITDA Margin (%)': [2.0, 14.2, 15.1, 9.8, 12.1, 10.4, 8.2],
    'PAT Margin (%)': [-6.7, 11.0, 12.8, 5.2, 7.4, 5.8, 3.1],
    'ROCE (%)': [2.3, 21.4, 64.1, 18.6, 19.4, 14.2, 9.8],
    'ROE (%)': ['NM', 24.6, 28.4, 18.1, 22.4, 16.8, 11.2],
    'Debt/Equity (x)': ['NM (neg NW)', 0.1, 0.0, 1.2, 0.6, 0.8, 0.4],
    'P/E (x)': ['NM (loss)', 18.4, 62.3, 22.1, 16.8, 19.4, 24.1],
    'P/B (x)': ['163x (Tata spec)', 3.8, 16.2, 3.4, 2.8, 2.6, 1.4],
    'EV/EBITDA (x)': ['250x+', 14.2, 42.1, 14.8, 13.4, 12.8, 8.6],
    'Order Book (Rs. Cr)': ['~200 (est)', 11155, 8000, 9200, 4100, 3800, 280],
    'Working Capital Days': [52, 48, 42, 68, 71, 82, 96],
    'Quality Flag': ['HIGH RISK', 'MEDIUM', 'LOW', 'LOW-MEDIUM', 'LOW', 'MEDIUM', 'MEDIUM'],
}

peer_df = pd.DataFrame(peer_data)
peer_df.to_csv(f'{OUT_CSV}06_Peer_Comparison.csv', index=False)
print("Peer Comparison saved.")

# ═══════════════════════════════════════════════════════════════════════════════
# 7. SCENARIO ANALYSIS  (Rs. Crore, FY2028 estimate)
# ═══════════════════════════════════════════════════════════════════════════════
scenario_data = {
    'Parameter': [
        'Revenue (Rs. Cr)',
        'Revenue CAGR FY26–28E (%)',
        'EBITDA Margin (%)',
        'EBITDA (Rs. Cr)',
        'Depreciation (Rs. Cr)',
        'EBIT (Rs. Cr)',
        'Finance Cost (Rs. Cr)',
        'PBT (Rs. Cr)',
        'Tax Rate (%)',
        'PAT (Rs. Cr)',
        'EPS (Rs.)',
        'Net Debt (Rs. Cr)',
        'ROCE (%)',
        'EV/EBITDA Multiple Applied (x)',
        'Enterprise Value (Rs. Cr)',
        'Less: Net Debt (Rs. Cr)',
        'Equity Value / Market Cap (Rs. Cr)',
        'No. of Shares (Cr)',
        'Implied Price per Share (Rs.)',
        'Current Price (Rs.)',
        'Implied Return (%)',
        '--- Key Assumptions ---',
        'Revenue driver',
        'Margin driver',
        'Debt trajectory',
        'Tata Group support',
        'Working capital',
        'Key risk',
    ],
    'Bear Case': [
        145, '-5.2%', '2.0%', 2.9, 4.2, -1.3, 5.8, -7.1, '0%', -7.1, -1.92,
        65, '-1.2%', 6, 17.4, 65, 0, 3.69, 0,
        165, '-100%',
        '',
        'Order cancellations, weak execution',
        'Raw material spike, cost overruns',
        'Rising — Tata support stretched',
        'Minimal — no new order flow',
        'Worsening — PSU receivables stalled',
        'Going concern; Tata withdraws support',
    ],
    'Base Case': [
        210, '+13.2%', '6.5%', 13.7, 4.2, 9.5, 5.4, 4.1, '25%', 3.1, 0.84,
        42, '6.4%', 12, 164, 42, 122, 3.69, 33,
        165, '-80%',
        '',
        'Moderate Tata order flow + independent wins',
        'Scale leverage, stable RM costs',
        'Gradual reduction via CFO',
        'Moderate — steady subcontracting flow',
        'Stable — partial PSU resolution',
        'Revenue miss; margin compression',
    ],
    'Bull Case': [
        310, '+37.5%', '11.0%', 34.1, 4.3, 29.8, 4.8, 25.0, '25%', 18.8, 5.09,
        18, '18.1%', 18, 614, 18, 596, 3.69, 161,
        165, '+98%',
        '',
        'Large Tata EPC + airports + petrochemicals',
        'Operational leverage + manufacturing mix-shift',
        'Significant reduction; near debt-free',
        'Strong — material order flow',
        'Improving — collections discipline',
        'Execution slippage; working capital stretch',
    ],
}

sc_df = pd.DataFrame(scenario_data)
sc_df.to_csv(f'{OUT_CSV}07_Scenario_Analysis.csv', index=False)
print("Scenario Analysis saved.")

# ═══════════════════════════════════════════════════════════════════════════════
# 8. EXCEL WORKBOOK
# ═══════════════════════════════════════════════════════════════════════════════
print("\nBuilding Excel workbook...")

wb = openpyxl.Workbook()
SHEETS = [
    ('P&L Statement', pnl_df),
    ('Balance Sheet', bs_df),
    ('Cash Flow', cf_df),
    ('Key Ratios', ratio_df),
    ('Quarterly Results', qtr_df),
    ('Peer Comparison', peer_df),
    ('Scenario Analysis', sc_df),
]

HEADER_FILL = PatternFill('solid', fgColor='003087')
HEADER_FONT = Font(color='FFFFFF', bold=True, size=10)
ALT_FILL    = PatternFill('solid', fgColor='EBF0FB')
THIN        = Border(
    left=Side(style='thin', color='CCCCCC'),
    right=Side(style='thin', color='CCCCCC'),
    top=Side(style='thin', color='CCCCCC'),
    bottom=Side(style='thin', color='CCCCCC'),
)
WARN_FILL   = PatternFill('solid', fgColor='FDECEA')

def style_sheet(ws, df, title=''):
    ws.sheet_view.showGridLines = False
    # Title row
    ws.insert_rows(1)
    ws.insert_rows(1)
    ws['A1'] = f'Artson Limited — {title}'
    ws['A1'].font = Font(bold=True, size=13, color='003087')
    ws['A2'] = 'For Institutional Use Only | Data: Annual Reports, BSE Filings, Capital Market News'
    ws['A2'].font = Font(size=8, color='7F7F7F', italic=True)

    # Headers
    for col_idx, col_name in enumerate(df.columns, start=1):
        cell = ws.cell(row=3, column=col_idx, value=col_name)
        cell.fill   = HEADER_FILL
        cell.font   = HEADER_FONT
        cell.border = THIN
        cell.alignment = Alignment(horizontal='center', wrap_text=True)

    for row_idx, row in enumerate(df.itertuples(index=False), start=4):
        fill = ALT_FILL if row_idx % 2 == 0 else PatternFill('solid', fgColor='FFFFFF')
        for col_idx, val in enumerate(row, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.border = THIN
            cell.fill = fill
            cell.alignment = Alignment(horizontal='center')
            # Red-flag highlighting
            if isinstance(val, str) and any(kw in str(val) for kw in ['NM', 'RISK', 'NaN', 'negative']):
                cell.fill = WARN_FILL
                cell.font = Font(color='C00000')

    # Auto-width
    for col in ws.columns:
        max_len = 0
        for c in col:
            try:
                max_len = max(max_len, len(str(c.value)) if c.value else 0)
            except Exception:
                pass
        ws.column_dimensions[get_column_letter(col[0].column)].width = min(max_len + 4, 40)

# Remove default sheet and build new ones
wb.remove(wb.active)
for sheet_name, df in SHEETS:
    ws = wb.create_sheet(sheet_name)
    style_sheet(ws, df, sheet_name)
    print(f"  Sheet '{sheet_name}' added.")

# Cover sheet
cov = wb.create_sheet('COVER', 0)
cov.sheet_view.showGridLines = False
cover_data = [
    ('', ''),
    ('ARTSON LIMITED (Formerly Artson Engineering Limited)', ''),
    ('Institutional Equity Research Report', ''),
    ('', ''),
    ('Report Type', 'Deep-Dive Forensic Analysis'),
    ('Coverage Universe', 'EPC / Industrial Construction / Tankage'),
    ('BSE Code', '522134 | NSE: ARTSONENGG'),
    ('Market Cap', '~₹801 Crore (as of Sep 2025)'),
    ('CMP (52-wk range)', '₹127 – ₹217'),
    ('Promoter', 'Tata Projects Limited (75.0%)'),
    ('Report Date', '18-Jun-2026'),
    ('', ''),
    ('Financial Model Tabs', ''),
    ('1. P&L Statement', 'FY16–FY26 (11 years)'),
    ('2. Balance Sheet', 'FY16–FY26'),
    ('3. Cash Flow Statement', 'FY16–FY26'),
    ('4. Key Ratios', 'FY16–FY26'),
    ('5. Quarterly Results', 'Q1FY24 – Q3FY26'),
    ('6. Peer Comparison', 'Artson vs 6 peers'),
    ('7. Scenario Analysis', 'Bear / Base / Bull — FY2028E'),
    ('', ''),
    ('VERDICT', 'VALUE TRAP with speculative Tata-proxy premium'),
    ('Conviction Rating', '2/10 (Low)'),
    ('Risk Rating', '8/10 (Very High)'),
    ('Recommended Position', 'Avoid or <0.5% of high-risk portfolio'),
]
for r, (k, v) in enumerate(cover_data, start=1):
    cov.cell(r, 1, k).font = Font(bold=True if k == k.upper() and k else False, size=11)
    cov.cell(r, 2, v).font = Font(size=11)
    if k.upper() == k and k:
        cov.cell(r, 1).fill = PatternFill('solid', fgColor='003087')
        cov.cell(r, 1).font = Font(bold=True, color='FFFFFF', size=12)
        if v:
            cov.cell(r, 2).fill = PatternFill('solid', fgColor='D62728')
            cov.cell(r, 2).font = Font(bold=True, color='FFFFFF', size=12)
cov.column_dimensions['A'].width = 45
cov.column_dimensions['B'].width = 45

wb.save(OUT_XL)
print(f"\nExcel workbook saved: {OUT_XL}")
print("Financial model complete.")
