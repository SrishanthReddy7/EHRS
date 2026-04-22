from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import json
import base64
import csv
import xml.etree.ElementTree as ET
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')  # Add this line at the top of the script

def save_key(key_file, key):
    with open(key_file, 'wb') as f:
        f.write(key)

def load_key(key_file):
    with open(key_file, 'rb') as f:
        return f.read()

def encrypt_data(data, key):
    nonce = get_random_bytes(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(data)
    
    return {
        "nonce": base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "tag": base64.b64encode(tag).decode()
    }

def decrypt_data(encrypted_data, key):
    nonce = base64.b64decode(encrypted_data["nonce"])
    ciphertext = base64.b64decode(encrypted_data["ciphertext"])
    tag = base64.b64decode(encrypted_data["tag"])
    
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag)

def csv_to_json(csv_file):
    data = []
    with open(csv_file, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            data.append(row)
    return json.dumps(data, indent=4)

def xml_to_json(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    def xml_to_dict(element):
        data_dict = {}
        for child in element:
            if len(child) > 0:
                data_dict[child.tag] = xml_to_dict(child)
            else:
                data_dict[child.tag] = child.text
        return data_dict
    
    data = xml_to_dict(root)
    return json.dumps(data, indent=4)

def txt_to_json(txt_file):
    data = {}
    with open(txt_file, mode='r', encoding='utf-8') as file:
        for line in file:
            if ':' in line:
                key, value = line.strip().split(':', 1)
                data[key.strip()] = value.strip()
    return json.dumps(data, indent=4)

def encrypt_file(input_file, output_file, key, is_json=False):
    with open(input_file, 'rb') as f:
        plaintext = f.read()
    
    encrypted_data = encrypt_data(plaintext, key)
    
    with open(output_file, "w", encoding="utf-8") as json_file:
        json.dump(encrypted_data, json_file, indent=4)

def decrypt_file(encrypted_file, output_file, key):
    output_file = os.path.join("uploads", os.path.basename(output_file))
    with open(encrypted_file, 'r', encoding="utf-8") as f:
        encrypted_data = json.load(f)

    plaintext = decrypt_data(encrypted_data, key)

    with open(output_file, 'wb') as f:
        f.write(plaintext)

def detect_file_type(file_path):
    return os.path.splitext(file_path)[1].lower()

if __name__ == "__main__":
    # Command line usage: python Encrypt.py <mode> <input_file_path> <output_file_path>
    if len(sys.argv) < 4:
        print("Usage: python Encrypt.py <mode> <input_file> <output_file>")
        exit()

    mode = sys.argv[1]  # mode can be "encrypt" or "decrypt"
    input_file = sys.argv[2]
    output_file = sys.argv[3]
    file_type = detect_file_type(input_file)

    key_file = "key"

    try:
        key = load_key(key_file)
    except FileNotFoundError:
        key = get_random_bytes(32)
        save_key(key_file, key)

    if mode == "encrypt":
        if file_type == ".pdf":
            encrypt_file(input_file, output_file, key)
            print(f"[SUCCESS] PDF encrypted successfully. Output saved to {output_file}")
        else:
            json_file = "converted_data.json"
            if file_type == ".csv":
                json_data = csv_to_json(input_file)
            elif file_type == ".xml":
                json_data = xml_to_json(input_file)
            elif file_type == ".txt":
                json_data = txt_to_json(input_file)
            else:
                print("[ERROR] Unsupported file type!")
                exit()
            
            with open(json_file, "w", encoding="utf-8") as f:
                f.write(json_data)

            encrypt_file(json_file, output_file, key)
            print(f"[SUCCESS] Non-PDF file converted to JSON and encrypted. Output saved to {output_file}")

    elif mode == "decrypt":
        if file_type == ".json":
            decrypt_file(input_file, output_file, key)
            print(f"[SUCCESS] File decrypted successfully. Output saved to {output_file}")
        else:
            print("[ERROR] Only .json files can be decrypted.")
            exit()
    else:
        print("[ERROR] Invalid mode. Use 'encrypt' or 'decrypt'.")
        exit()
