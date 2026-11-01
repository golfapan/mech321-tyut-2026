"""MECH321 reproducible lecture demonstration; output is a PNG figure."""

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "Code/Figures/Lecture"
OUT.mkdir(parents=True, exist_ok=True)
plt.rcParams.update({"font.family": "Arial", "font.size": 12, "axes.spines.top": False, "axes.spines.right": False})
NAVY = "#122B46"
TEAL = "#087E87"
RED = "#C8463D"


def save(name, title, xlabel, ylabel):
    plt.title(title, color=NAVY, fontweight="bold")
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.grid(alpha=0.22)
    plt.tight_layout()
    plt.savefig(OUT / f"L{name:02d}.png", dpi=200, facecolor="white")
    plt.close()



# Lecture 08: stability margins
w=np.logspace(-2,2,650);plt.figure(figsize=(9,4.4))
for gain,color in [(40,TEAL),(80,RED)]:
    om=w
    response=gain/((1j*w+1)*(1j*w+2)*(1j*w+5))
    plt.semilogx(om,20*np.log10(np.abs(response)),lw=2.3,color=color,label=f"K = {gain}")
plt.axhline(0,color=NAVY,ls=":");plt.legend()
save(8,"Loop-gain change moves the gain crossover","Frequency (rad/s)","Loop magnitude (dB)")

print('L08 complete:', OUT / 'L08.png')
