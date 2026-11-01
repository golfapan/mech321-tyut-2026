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



# Lecture 09: gain and poles
plt.figure(figsize=(6,6))
for gain,color in [(0.25,NAVY),(1,TEAL),(4,RED),(9,"#763DA8")]:
    poles=np.roots([1,2,gain]);plt.scatter(poles.real,poles.imag,s=110,color=color,label=f"K = {gain}")
plt.axvline(0,color="black",lw=.8);plt.axis("equal");plt.legend()
save(9,"Closed-loop poles move with proportional gain","Real part (1/s)","Imaginary part (rad/s)")

print('L09 complete:', OUT / 'L09.png')
