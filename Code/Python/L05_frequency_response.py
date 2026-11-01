"""MECH321 reproducible lecture demonstration; output is a PNG figure."""

from pathlib import Path

import control as ct
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.integrate import solve_ivp


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



# Lecture 05: frequency response
w=np.logspace(-1,2.3,500);g=ct.tf([80,1000],[10,80,1000]);mag,phase,om=ct.frequency_response(g,w)
plt.figure(figsize=(9,4.4));plt.semilogx(om,mag,color=TEAL,lw=2.5);plt.axhline(1,color=RED,ls="--",label="No amplification");plt.axvline(20,color=NAVY,ls=":",label="20 rad/s");plt.legend()
save(5,"Base-to-platform transmissibility","Frequency (rad/s)","|X/R|")

print('L05 complete:', OUT / 'L05.png')
