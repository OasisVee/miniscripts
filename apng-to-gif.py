import os
from PIL import Image


def is_apng(file_path):
    # Checks if a PNG file is an APNG file
    try:
        with Image.open(file_path) as img:
            return img.format == 'PNG' and img.is_animated
    except Image.UnidentifiedImageError:
        print(f"Skipping file {file_path} - unable to identify image")
        return False


def convert_apng_to_gif(file_path):
    # Converts the APNG files to GIF
    with Image.open(file_path) as img:
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        img.save(file_path.replace('.png', '.gif'), 'GIF', save_all=True)


def process_png_files(folder_path):
    # Process PNG files in a folder
    for file_name in os.listdir(folder_path):
        if file_name.endswith('.png'):
            file_path = os.path.join(folder_path, file_name)
            if is_apng(file_path):
                print(f"Converting {file_name} to GIF...")
                convert_apng_to_gif(file_path)
                os.remove(file_path)
            else:
                print(f"{file_name} is not an APNG file, keeping as PNG")


folder_path = input("Enter the path to your folder: ")
process_png_files(folder_path)
