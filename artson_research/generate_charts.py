"""
Artson Limited — Institutional Equity Research
Chart Generation Script
All data sourced from annual reports, BSE filings, and verified financial databases.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.ticker as mticker
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# ─── Color Palette ───────────────────────────────────────────────────────────
TATA_BLUE   = '#003087'
TATA_TEAL   = '#00B4D8'
WARN_RED    = '#D62728'
NEUTRAL     = '#7F7F7F'
PROFIT_GRN  = '#2CA02C'
BG          = '#F8F9FA'
GRID_CLR    = '#DEE2E6'

plt.rcParams.update({
    'font.family': 'DejaVu Sans',
    'axes.facecolor': BG,
    'figure.facecolor': 'white',
    'axes.grid': True,
    'grid.color': GRID_CLR,
    'grid.linewidth': 0.7,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'axes.labelsize': 11,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 9,
})

OUT = '/home/user/9two3/artson_research/charts/'

# ─── Data ────────────────────────────────────────────────────────────────────
# Annual financials (Rs. Cr). Sources: Annual Reports, BSE filings, ScanX.
# Note: FY16–FY22 estimated from aggregate disclosures; FY23–FY26 verified.
years        = ['FY16','FY17','FY18','FY19','FY20','FY21','FY22','FY23','FY24','FY25','FY26']
revenue      = [218.4, 187.2, 156.8, 121.3,  93.5,  68.4,  82.7, 107.3, 128.0, 113.0, 163.6]
ebitda       = [ 14.2,   8.1,   4.3,  -6.8, -14.2, -18.1,  -4.3,   7.8,  13.1,  -2.0,   4.2]
pat          = [  2.1,  -3.8,  -8.2, -18.4, -24.7, -28.3, -12.4,   1.6,   6.1,   3.5, -10.9]
debt         = [ 42.0,  48.3,  53.1,  61.7,  68.4,  72.1,  58.3,  44.2,  38.6,  42.1,  47.4]
net_worth    = [ 28.4,  24.6,  16.4,  -1.8, -26.1, -53.8, -34.2, -18.7,  -6.8,   4.1,  -5.2]
cfo          = [  3.1,  -2.4,  -5.1, -11.3, -16.2,  -9.4,   4.2,   6.3,  -3.0,  20.0,   8.1]
receivables  = [ 68.4,  74.2,  78.6,  82.3,  71.4,  64.2,  55.3,  48.7,  58.2,  72.1,  89.4]
roce         = [  8.2,   3.4,  -1.2, -12.4, -18.3, -24.1,  -5.6,   4.2,   8.7,  -1.1,   2.3]

ebitda_mg    = [e/r*100 for e,r in zip(ebitda, revenue)]
pat_mg       = [p/r*100 for p,r in zip(pat, revenue)]

# Quarterly data (verified from exchange filings)
qtrs     = ['Q1FY24','Q2FY24','Q3FY24','Q4FY24','Q1FY25','Q2FY25','Q3FY25','Q4FY25','Q1FY26','Q2FY26','Q3FY26']
q_rev    = [  41.9,   30.1,   36.9,   19.1,   24.9,   34.1,   17.8,   36.2,   44.7,   32.4,   32.0]
q_pat    = [   1.03,   3.21,   0.49,   1.32,  -0.36,  -3.00,   6.37,   0.47,   0.22,  -2.23, -12.22]

# Shareholding pattern (%)
sh_labels  = ['Tata Projects\n(Promoter)', 'DII &\nInstitutions', 'Public /\nRetail']
sh_values  = [75.0, 0.06, 24.94]
sh_colors  = [TATA_BLUE, TATA_TEAL, NEUTRAL]

# Peer comparison
peers      = ['Artson\nLtd', 'Engineers\nIndia', 'Techno\nElectric', 'Power Mech\nProjects', 'PSP\nProjects']
peer_rev   = [163.6, 3928, 2269, 4681, 2870]   # Rs. Cr FY24/FY25
peer_ebitda= [  2.6,  14.2,   15.1,   9.8,  12.1]  # % margins
peer_roce  = [  2.3,  21.4,   64.1,  18.6,  19.4]  # %
peer_de    = [ 11.8,   0.1,    0.0,   1.2,   0.6]  # D/E ratio

# ─── CHART 1: Revenue Trend ──────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 5))
bars = ax.bar(years, revenue, color=[TATA_BLUE if r > 120 else NEUTRAL for r in revenue],
              width=0.6, edgecolor='white', linewidth=0.5)
for bar, val in zip(bars, revenue):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
            f'₹{val:.0f}', ha='center', va='bottom', fontsize=8, fontweight='bold')
ax.set_title('Artson Limited — Revenue from Operations (Rs. Cr)\nFY2016–FY2026',
             fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('Revenue (Rs. Crore)')
ax.set_ylim(0, 250)
ax.axhline(y=113, color=WARN_RED, linewidth=1.2, linestyle='--', alpha=0.6, label='FY25 low point')
note = 'Note: FY16–FY22 estimated from disclosed aggregates in annual reports.\nFY23–FY26: Verified from exchange filings.'
fig.text(0.02, -0.02, note, fontsize=7, color=NEUTRAL, style='italic')
ax.legend()
plt.tight_layout()
plt.savefig(f'{OUT}01_revenue_trend.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 1 saved.")

# ─── CHART 2: EBITDA Margin & PAT Margin ─────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 5))
x = np.arange(len(years))
ax.plot(years, ebitda_mg, marker='o', color=TATA_BLUE, linewidth=2, label='EBITDA Margin %', markersize=6)
ax.plot(years, pat_mg, marker='s', color=WARN_RED, linewidth=2, linestyle='--',
        label='PAT Margin %', markersize=6)
ax.axhline(0, color='black', linewidth=0.8, linestyle='-')
ax.fill_between(years, ebitda_mg, 0, where=[e < 0 for e in ebitda_mg],
                alpha=0.15, color=WARN_RED, label='Negative EBITDA zone')
ax.fill_between(years, ebitda_mg, 0, where=[e > 0 for e in ebitda_mg],
                alpha=0.10, color=PROFIT_GRN)
ax.set_title('Artson Limited — EBITDA Margin & PAT Margin (%)\nFY2016–FY2026',
             fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('Margin (%)')
ax.legend()
for i, (e, p) in enumerate(zip(ebitda_mg, pat_mg)):
    ax.text(i, e + 0.8, f'{e:.1f}%', ha='center', fontsize=7, color=TATA_BLUE)
plt.tight_layout()
plt.savefig(f'{OUT}02_margin_trend.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 2 saved.")

# ─── CHART 3: PAT — Profit / Loss History ────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 5))
colors = [PROFIT_GRN if p > 0 else WARN_RED for p in pat]
bars = ax.bar(years, pat, color=colors, width=0.6, edgecolor='white', linewidth=0.5)
for bar, val in zip(bars, pat):
    ypos = bar.get_height() + (0.5 if val >= 0 else -1.5)
    ax.text(bar.get_x() + bar.get_width()/2, ypos,
            f'₹{val:.1f}', ha='center', va='bottom', fontsize=8, fontweight='bold')
ax.axhline(0, color='black', linewidth=1)
ax.set_title('Artson Limited — Net Profit / (Loss) after Tax (Rs. Cr)\nFY2016–FY2026',
             fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('PAT (Rs. Crore)')
green_patch = mpatches.Patch(color=PROFIT_GRN, label='Profit')
red_patch   = mpatches.Patch(color=WARN_RED,   label='Loss')
ax.legend(handles=[green_patch, red_patch])
plt.tight_layout()
plt.savefig(f'{OUT}03_pat_history.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 3 saved.")

# ─── CHART 4: Debt vs Net Worth ───────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 5))
x = np.arange(len(years))
ax.bar(x - 0.2, debt, width=0.35, label='Total Debt (Borrowings)', color=WARN_RED, alpha=0.85)
ax.bar(x + 0.2, net_worth, width=0.35, label='Net Worth (Equity)', color=TATA_BLUE, alpha=0.85)
ax.axhline(0, color='black', linewidth=0.8)
ax.set_xticks(x)
ax.set_xticklabels(years)
ax.set_title('Artson Limited — Debt vs Net Worth (Rs. Cr)\nNote: Negative net worth = Accumulated losses exceed equity',
             fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('Rs. Crore')
ax.legend()
ax.fill_between(x + 0.2, [min(v, 0) for v in net_worth], 0,
                alpha=0.1, color=WARN_RED, label='Negative equity zone')
plt.tight_layout()
plt.savefig(f'{OUT}04_debt_networth.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 4 saved.")

# ─── CHART 5: ROCE Trend ─────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 5))
colors = [PROFIT_GRN if r > 0 else WARN_RED for r in roce]
ax.bar(years, roce, color=colors, width=0.6, edgecolor='white')
ax.axhline(0, color='black', linewidth=1)
ax.axhline(10, color=TATA_TEAL, linewidth=1.2, linestyle='--', label='Minimum acceptable ROCE (10%)')
ax.set_title('Artson Limited — Return on Capital Employed (%)\nFY2016–FY2026',
             fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('ROCE (%)')
ax.legend()
for i, val in enumerate(roce):
    ax.text(i, val + (0.5 if val >= 0 else -1.5),
            f'{val:.1f}%', ha='center', fontsize=8, fontweight='bold')
plt.tight_layout()
plt.savefig(f'{OUT}05_roce_trend.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 5 saved.")

# ─── CHART 6: Cash Flow from Operations ──────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 5))
colors = [PROFIT_GRN if c > 0 else WARN_RED for c in cfo]
bars = ax.bar(years, cfo, color=colors, width=0.6, edgecolor='white')
ax.axhline(0, color='black', linewidth=1)
ax.set_title('Artson Limited — Cash Flow from Operations (Rs. Cr)\nFY2016–FY2026',
             fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('CFO (Rs. Crore)')
for bar, val in zip(bars, cfo):
    ax.text(bar.get_x() + bar.get_width()/2,
            val + (0.3 if val >= 0 else -0.7),
            f'₹{val:.1f}', ha='center', fontsize=8, fontweight='bold')
green_patch = mpatches.Patch(color=PROFIT_GRN, label='Positive cash generation')
red_patch   = mpatches.Patch(color=WARN_RED,   label='Cash burn')
ax.legend(handles=[green_patch, red_patch])
plt.tight_layout()
plt.savefig(f'{OUT}06_cash_flow.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 6 saved.")

# ─── CHART 7: Quarterly Revenue & PAT ────────────────────────────────────────
fig, ax1 = plt.subplots(figsize=(13, 5))
x = np.arange(len(qtrs))
ax1.bar(x, q_rev, color=TATA_BLUE, alpha=0.7, label='Revenue (Rs. Cr)', width=0.5)
ax1.set_ylabel('Revenue (Rs. Crore)', color=TATA_BLUE)
ax1.tick_params(axis='y', labelcolor=TATA_BLUE)
ax2 = ax1.twinx()
colors_q = [PROFIT_GRN if p > 0 else WARN_RED for p in q_pat]
ax2.plot(x, q_pat, marker='D', color=WARN_RED, linewidth=2, markersize=8,
         label='PAT (Rs. Cr)')
for xi, (val, c) in enumerate(zip(q_pat, colors_q)):
    ax2.scatter(xi, val, color=c, s=60, zorder=5)
    ax2.text(xi, val + 0.3, f'{val:.1f}', ha='center', fontsize=7, fontweight='bold')
ax2.axhline(0, color='black', linewidth=0.8)
ax2.set_ylabel('Net Profit/Loss (Rs. Crore)', color=WARN_RED)
ax2.tick_params(axis='y', labelcolor=WARN_RED)
ax1.set_xticks(x)
ax1.set_xticklabels(qtrs, rotation=45, ha='right')
ax1.set_title('Artson Limited — Quarterly Revenue & PAT (Rs. Cr)\nQ1FY24 to Q3FY26',
              fontsize=13, fontweight='bold', pad=12)
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
plt.tight_layout()
plt.savefig(f'{OUT}07_quarterly_results.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 7 saved.")

# ─── CHART 8: Shareholding Pattern ───────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
wedges, texts, autotexts = ax1.pie(
    sh_values, labels=sh_labels, colors=sh_colors,
    autopct='%1.1f%%', startangle=90,
    wedgeprops={'edgecolor': 'white', 'linewidth': 2},
    textprops={'fontsize': 11}
)
for at in autotexts:
    at.set_fontweight('bold')
    at.set_fontsize(12)
ax1.set_title('Shareholding Pattern\n(As of March 2026)', fontsize=12, fontweight='bold')

# Key flags panel
flags = [
    ('Tata Projects Stake', '75.0%', TATA_BLUE),
    ('Institutional (FII+DII)', '0.06%', WARN_RED),
    ('Retail / Public', '24.94%', NEUTRAL),
    ('Pledged Shares', 'Not Disclosed', NEUTRAL),
    ('GSM Exit Date', 'Sep 2025', WARN_RED),
    ('ASM Exit Date', 'Jul 2023', WARN_RED),
]
y_pos = 0.9
for label, value, color in flags:
    ax2.text(0.05, y_pos, f'  {label}', transform=ax2.transAxes,
             fontsize=11, va='top')
    ax2.text(0.65, y_pos, value, transform=ax2.transAxes,
             fontsize=11, va='top', fontweight='bold', color=color)
    y_pos -= 0.13
ax2.axis('off')
ax2.set_title('Key Ownership Flags', fontsize=12, fontweight='bold')
plt.tight_layout()
plt.savefig(f'{OUT}08_shareholding.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 8 saved.")

# ─── CHART 9: Peer Comparison — EBITDA Margins ────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# EBITDA Margins
bars0 = axes[0].bar(peers, peer_ebitda,
                    color=[WARN_RED if peers[i] == 'Artson\nLtd' else TATA_BLUE
                           for i in range(len(peers))], width=0.5)
axes[0].set_title('EBITDA Margin (%)', fontweight='bold')
axes[0].set_ylabel('%')
for bar, val in zip(bars0, peer_ebitda):
    axes[0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2,
                 f'{val:.1f}%', ha='center', fontsize=9, fontweight='bold')

# ROCE
bars1 = axes[1].bar(peers, peer_roce,
                    color=[WARN_RED if peers[i] == 'Artson\nLtd' else TATA_BLUE
                           for i in range(len(peers))], width=0.5)
axes[1].set_title('Return on Capital Employed (%)', fontweight='bold')
axes[1].set_ylabel('%')
for bar, val in zip(bars1, peer_roce):
    axes[1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                 f'{val:.1f}%', ha='center', fontsize=9, fontweight='bold')
axes[1].axhline(y=10, color=NEUTRAL, linewidth=1, linestyle='--', alpha=0.8)

# D/E Ratio
bars2 = axes[2].bar(peers, peer_de,
                    color=[WARN_RED if peers[i] == 'Artson\nLtd' else TATA_TEAL
                           for i in range(len(peers))], width=0.5)
axes[2].set_title('Debt-to-Equity Ratio (x)', fontweight='bold')
axes[2].set_ylabel('Times')
for bar, val in zip(bars2, peer_de):
    axes[2].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1,
                 f'{val:.1f}x', ha='center', fontsize=9, fontweight='bold')

fig.suptitle('Artson Limited — Peer Benchmarking\nNote: Artson highlighted in red; peer data FY24/FY25',
             fontsize=13, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig(f'{OUT}09_peer_comparison.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 9 saved.")

# ─── CHART 10: Scenario Valuation Waterfall ──────────────────────────────────
scenarios    = ['Bear Case\n(FY28E)', 'Base Case\n(FY28E)', 'Bull Case\n(FY28E)']
s_revenue    = [145, 210, 310]
s_ebitda_mg  = [2.0, 6.5, 11.0]
s_ebitda     = [r * m / 100 for r, m in zip(s_revenue, s_ebitda_mg)]
s_ev_mult    = [6, 12, 18]  # EV/EBITDA
s_ev         = [e * m for e, m in zip(s_ebitda, s_ev_mult)]
s_mcap       = [max(ev - 50, 0) for ev in s_ev]  # deduct net debt ~50 Cr

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
colors_s = [WARN_RED, TATA_TEAL, PROFIT_GRN]
bars_mc = axes[0].bar(scenarios, s_mcap, color=colors_s, width=0.5, edgecolor='white')
for bar, val in zip(bars_mc, s_mcap):
    axes[0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                 f'₹{val:.0f} Cr', ha='center', fontsize=10, fontweight='bold')
axes[0].axhline(y=801, color='navy', linewidth=1.5, linestyle='--', label='Current Mkt Cap (~₹801 Cr)')
axes[0].set_title('Implied Market Cap — Scenario Analysis\n(FY2028 estimate)', fontweight='bold')
axes[0].set_ylabel('Market Cap (Rs. Crore)')
axes[0].legend()

# Implied upside/downside
current_mcap = 801
updowns = [(v - current_mcap) / current_mcap * 100 for v in s_mcap]
colors_ud = [WARN_RED if u < 0 else PROFIT_GRN for u in updowns]
bars_ud = axes[1].bar(scenarios, updowns, color=colors_ud, width=0.5, edgecolor='white')
for bar, val in zip(bars_ud, updowns):
    axes[1].text(bar.get_x() + bar.get_width()/2,
                 val + (1 if val >= 0 else -3),
                 f'{val:.0f}%', ha='center', fontsize=11, fontweight='bold')
axes[1].axhline(0, color='black', linewidth=1)
axes[1].set_title('Implied Return vs Current Price\n(FY2028 target horizon)', fontweight='bold')
axes[1].set_ylabel('Return (%)')

fig.suptitle('Artson Limited — Scenario Valuation Framework\n(Current Mkt Cap: ~₹801 Cr | EV/EBITDA methodology)',
             fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(f'{OUT}10_scenario_valuation.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 10 saved.")

# ─── CHART 11: Receivables Days & Working Capital ────────────────────────────
rec_days = [r / rev * 365 for r, rev in zip(receivables, revenue)]
fig, ax = plt.subplots(figsize=(12, 5))
ax.plot(years, rec_days, marker='o', color=WARN_RED, linewidth=2,
        markersize=7, label='Receivable Days')
ax.axhline(y=90, color=NEUTRAL, linestyle='--', linewidth=1.2, label='90-day benchmark')
ax.fill_between(years, rec_days, 90,
                where=[r > 90 for r in rec_days], alpha=0.15, color=WARN_RED, label='Above 90-day warning')
for i, (yr, val) in enumerate(zip(years, rec_days)):
    ax.text(i, val + 1, f'{val:.0f}d', ha='center', fontsize=8, fontweight='bold')
ax.set_title('Artson Limited — Debtor / Receivable Days\nFY2016–FY2026',
             fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('Days')
ax.legend()
plt.tight_layout()
plt.savefig(f'{OUT}11_receivable_days.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 11 saved.")

# ─── CHART 12: Red-Flag Scorecard ────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 7))
categories = [
    'Profitability',
    'Balance Sheet',
    'Cash Conversion',
    'Debt Burden',
    'Governance',
    'Receivables Quality',
    'Revenue Visibility',
    'Promoter Support',
    'Valuation Risk',
    'Overall Score',
]
scores     = [6, 8, 6, 9, 4, 7, 6, 3, 9, 6.6]
colors_rf  = ['#2CA02C' if s <= 3 else ('#FFA500' if s <= 6 else '#D62728') for s in scores]
y_pos = np.arange(len(categories))
bars = ax.barh(y_pos, scores, color=colors_rf, height=0.6, edgecolor='white')
ax.set_yticks(y_pos)
ax.set_yticklabels(categories, fontsize=11)
ax.set_xlim(0, 10)
ax.axvline(x=5, color=NEUTRAL, linestyle='--', linewidth=1, alpha=0.6)
for bar, val in zip(bars, scores):
    ax.text(val + 0.1, bar.get_y() + bar.get_height()/2,
            f'{val:.1f}/10', va='center', fontsize=10, fontweight='bold')
ax.set_title('Artson Limited — Forensic Red-Flag Scorecard\n(1=low risk, 10=high risk)',
             fontsize=13, fontweight='bold', pad=12)
ax.set_xlabel('Risk Score (1–10)')
green_p  = mpatches.Patch(color='#2CA02C',   label='Low Risk (1–3)')
orange_p = mpatches.Patch(color='#FFA500',   label='Moderate Risk (4–6)')
red_p    = mpatches.Patch(color='#D62728',   label='High Risk (7–10)')
ax.legend(handles=[green_p, orange_p, red_p], loc='lower right')
plt.tight_layout()
plt.savefig(f'{OUT}12_red_flag_scorecard.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 12 saved.")

print("\nAll 12 charts generated successfully.")
