"""Verify the MECH321 Python teaching environment."""

import sys

import control as ct
import jupyterlab
import matplotlib
import numpy as np
import scipy


def main() -> None:
    plant = ct.tf([1], [1, 2, 1])
    closed_loop = ct.feedback(4 * plant, 1)
    poles = ct.poles(closed_loop)
    assert poles.size == 2
    assert np.all(np.isfinite(poles))

    print("MECH321 Python setup passed")
    print(f"Python {sys.version.split()[0]}")
    print(f"NumPy {np.__version__}")
    print(f"SciPy {scipy.__version__}")
    print(f"Matplotlib {matplotlib.__version__}")
    print(f"python-control {ct.__version__}")
    print(f"JupyterLab {jupyterlab.__version__}")
    print(f"Test closed-loop poles: {poles}")


if __name__ == "__main__":
    main()
