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



# Lecture 07: feedback paths
s=ct.tf("s");g=4/(s+2);T=ct.feedback(2*g,1);S=ct.feedback(1,2*g);tt=np.linspace(0,2,1200);tr,yr=ct.step_response(8*T,tt);_,yd=ct.step_response(S,tt)
plt.figure(figsize=(9,4.4));plt.plot(tr,yr,label="8-unit reference response",color=TEAL,lw=2.5);plt.plot(tr,yd,label="Unit output-disturbance response",color=RED,lw=2);plt.legend()
save(7,"Tracking and disturbance use the same loop poles","Time (s)","Output")

print('L07 complete:', OUT / 'L07.png')
