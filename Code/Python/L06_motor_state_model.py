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



# Lecture 06: motor state model
g=ct.tf([.1],[.004,.1,.41]);tt=np.linspace(0,2,1200);tr,y=ct.step_response(10*g,tt)
plt.figure(figsize=(9,4.4));plt.plot(tr,y,color=TEAL,lw=2.5);plt.axhline(10*ct.dcgain(g),color=RED,ls="--",label="DC prediction");plt.legend()
save(6,"Full motor model: 10 V speed step","Time (s)","Speed (rad/s)")

print('L06 complete:', OUT / 'L06.png')
