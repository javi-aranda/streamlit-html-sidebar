from setuptools import setup, find_packages

# Read the contents of the README file
with open("README.md", encoding="utf-8") as f:
    long_description = f.read()

# Read the requirements file
with open("requirements.txt", encoding="utf-8") as f:
    requirements = f.read().splitlines()

setup(
    name="streamlit-html-sidebar",
    version="0.2.0",
    author="Javier Aranda",
    description="A Streamlit component that creates a customizable sidebar with HTML content",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/javi-aranda/streamlit-html-sidebar",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "streamlit_html_sidebar": ["static/*"],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=requirements,
) 