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



# Lecture 04: second order response
tt=np.linspace(0,3,1200);plt.figure(figsize=(9,4.4))
for zeta,color in [(.5,TEAL),(.8,RED)]:
    g=ct.tf([36],[1,12*zeta,36]);tr,y=ct.step_response(g,tt);plt.plot(tr,y,lw=2.3,color=color,label=f"ζ = {zeta}")
plt.axhline(1,color=NAVY,ls=":");plt.legend()
save(4,"Damping changes the peak and decay","Time (s)","Unit-step output")

print('L04 complete:', OUT / 'L04.png')
