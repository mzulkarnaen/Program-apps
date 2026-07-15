#!/usr/bin/env python3
"""
Program matematika sederhana untuk menghitung Phytagoras.
Rumus: c² = a² + b²
Dimana c adalah sisi miring, dan a serta b adalah sisi siku-siku.
"""

import math

def hitung_sisi_miring(a, b):
    """Menghitung sisi miring (c) jika diketahui sisi a dan b."""
    return math.sqrt(a**2 + b**2)

def hitung_sisi_siku(a, c):
    """Menghitung sisi siku-siku (b) jika diketahui sisi a dan c (sisi miring)."""
    if c <= a:
        raise ValueError("Sisi miring (c) harus lebih besar dari sisi siku-siku (a).")
    return math.sqrt(c**2 - a**2)

def main():
    print("=" * 40)
    print("Program Menghitung Phytagoras Sederhana")
    print("=" * 40)
    print("\nPilih yang ingin dihitung:")
    print("1. Sisi Miring (c)")
    print("2. Sisi Siku-siku (a atau b)")
    
    pilihan = input("\nMasukkan pilihan (1/2): ")
    
    try:
        if pilihan == '1':
            a = float(input("Masukkan panjang sisi a: "))
            b = float(input("Masukkan panjang sisi b: "))
            
            if a <= 0 or b <= 0:
                print("Error: Panjang sisi harus lebih dari 0.")
                return
                
            c = hitung_sisi_miring(a, b)
            print(f"\nHasil:")
            print(f"Sisi miring (c) = √({a}² + {b}²) = {c:.2f}")
            
        elif pilihan == '2':
            print("\nCatatan: Masukkan sisi miring sebagai nilai terbesar.")
            sisi_diketahui = float(input("Masukkan panjang salah satu sisi siku-siku yang diketahui: "))
            sisi_miring = float(input("Masukkan panjang sisi miring: "))
            
            if sisi_diketahui <= 0 or sisi_miring <= 0:
                print("Error: Panjang sisi harus lebih dari 0.")
                return
                
            sisi_lain = hitung_sisi_siku(sisi_diketahui, sisi_miring)
            print(f"\nHasil:")
            print(f"Sisi siku-siku yang lain = √({sisi_miring}² - {sisi_diketahui}²) = {sisi_lain:.2f}")
            
        else:
            print("Pilihan tidak valid. Silakan jalankan program lagi dan pilih 1 atau 2.")
            
    except ValueError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Terjadi kesalahan: {e}")

if __name__ == "__main__":
    main()
