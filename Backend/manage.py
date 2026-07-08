#!/usr/bin/env python3
import os
import sys
from pathlib import Path


def use_project_venv():
    base_dir = Path(__file__).resolve().parent
    venv_dir = base_dir / ".venv"
    venv_python = base_dir / ".venv" / "bin" / "python"

    if venv_python.exists() and Path(sys.prefix).resolve() != venv_dir.resolve():
        os.execv(venv_python, [str(venv_python), *sys.argv])


def main():
    use_project_venv()
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "signpdf.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
