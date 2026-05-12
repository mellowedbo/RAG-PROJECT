"""
NEXUS Core — Setup configuration for pip-installable package.
"""

from setuptools import setup, find_packages

setup(
    name="nexus-core",
    version="1.0.0",
    description="Agentic RAG Pipeline for Financial Intelligence",
    long_description=open("README.md", encoding="utf-8").read() if __import__("os").path.exists("README.md") else "",
    long_description_content_type="text/markdown",
    author="NEXUS",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[],
    extras_require={
        "gemini": ["google-generativeai>=0.3.0"],
        "viz": ["matplotlib>=3.5", "pandas>=1.4", "numpy>=1.22"],
        "dev": ["pytest>=7.0"],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Office/Business :: Financial",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
)
