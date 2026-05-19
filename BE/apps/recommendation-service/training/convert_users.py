#!/usr/bin/env python3
"""
convert_users.py
================
Convert file u.user (định dạng MovieLens 100K gốc) sang users.csv

Chạy:
    python training/convert_users.py
    python training/convert_users.py --force   # ghi đè nếu users.csv đã tồn tại
"""

import argparse
import sys
from pathlib import Path

import pandas as pd

# Tìm thư mục data/ từ vị trí file này
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"


def convert_u_user(force: bool = False) -> None:
    u_user_path = DATA_DIR / "u.user"
    output_path = DATA_DIR / "users.csv"

    # Kiểm tra file u.user có tồn tại không
    if not u_user_path.exists():
        print(f"[convert_users] ❌ Không tìm thấy file: {u_user_path}")
        print("  Vui lòng đặt file u.user vào thư mục data/")
        sys.exit(1)

    # Kiểm tra nếu users.csv đã tồn tại
    if output_path.exists() and not force:
        print(f"[convert_users] ℹ️  File users.csv đã tồn tại tại: {output_path}")
        print("  Dùng --force để ghi đè.")
        return

    print(f"[convert_users] Đang convert {u_user_path} → {output_path}...")

    user_cols = ["userId", "age", "gender", "occupation", "zip_code"]
    users_df = pd.read_csv(
        u_user_path,
        sep="|",
        names=user_cols,
        encoding="latin-1",
    )

    users_df.to_csv(output_path, index=False)
    print(f"[convert_users] ✅ Đã lưu {len(users_df)} users vào {output_path}")
    print(f"  Cột: {list(users_df.columns)}")
    print(users_df.head(3).to_string())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert u.user → users.csv")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Ghi đè users.csv nếu đã tồn tại",
    )
    args = parser.parse_args()
    convert_u_user(force=args.force)
