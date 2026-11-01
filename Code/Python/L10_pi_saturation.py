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



# Lecture 10: pi saturation
ts=.002;tt=np.arange(0,5+ts,ts);reference=np.ones_like(tt);limit=1.5
def simulate(antiwindup):
    y=np.zeros_like(tt);integ=0.
    for j in range(1,len(tt)):
        err=1-y[j-1]
        unsat=6*err+integ
        u=np.clip(unsat,-limit,limit)
        if not antiwindup or abs(unsat)<=limit or np.sign(err)!=np.sign(unsat): integ+=12*err*ts
        y[j]=y[j-1]+ts*(-y[j-1]+u)
    return y
plt.figure(figsize=(9,4.4));plt.plot(tt,reference,ls="--",color=NAVY,label="Command");plt.plot(tt,simulate(False),color=RED,lw=2,label="PI without anti-windup");plt.plot(tt,simulate(True),color=TEAL,lw=2.5,label="PI with anti-windup");plt.legend()
save(10,"Saturation changes the PI response","Time (s)","Output")

print('L10 complete:', OUT / 'L10.png')
