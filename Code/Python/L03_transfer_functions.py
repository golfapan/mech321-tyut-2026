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



# Lecture 03: transfer functions
g=ct.tf([1],[2,8,50]);tt=np.linspace(0,4,1200);tr,y=ct.step_response(10*g,tt)
plt.figure(figsize=(9,4.4));plt.plot(tr,y,color=TEAL,lw=2.5);plt.axhline(.2,color=RED,ls="--",label="F/k = 0.20 m");plt.legend()
save(3,"10 N step: force-to-displacement model","Time (s)","Displacement (m)")

print('L03 complete:', OUT / 'L03.png')
