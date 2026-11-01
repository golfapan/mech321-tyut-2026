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



# Lecture 02: governing equation
def bump(t, amp=.03, duration=.35):
    return np.where((t>=0)&(t<=duration), amp/2*(1-np.cos(2*np.pi*t/duration)), 0)
def bumpdot(t, amp=.03, duration=.35):
    return np.where((t>=0)&(t<=duration), amp*np.pi/duration*np.sin(2*np.pi*t/duration), 0)
t=np.linspace(0,2,2500);m=4;c=8;k=80
def rhs(tt,z):
    r=float(bump(np.array([tt]))[0]);rd=float(bumpdot(np.array([tt]))[0]);return [z[1],(c*(rd-z[1])+k*(r-z[0]))/m]
sol=solve_ivp(rhs,(0,2),(0,0),t_eval=t,rtol=1e-9,atol=1e-11)
plt.figure(figsize=(9,4.4));plt.plot(t,1000*bump(t),label="Moving base r",color=RED,lw=2);plt.plot(t,1000*sol.y[0],label="Mass x",color=TEAL,lw=2.4);plt.legend()
save(2,"Base excitation uses relative spring and damper motion","Time (s)","Displacement (mm)")

print('L02 complete:', OUT / 'L02.png')
