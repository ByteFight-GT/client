# Security Policy

## Overview

The ByteFight Client repository is committed to maintaining a secure and responsible development environment. We take all reported vulnerabilities seriously and aim to address them promptly to protect users, contributors, and infrastructure.

This document outlines how to report security vulnerabilities, what to expect after reporting, and best practices for responsible disclosure.

---

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version                 | Supported |
| ----------------------- | --------- |
| Latest (main)           | ✅         |
| Previous stable release | ✅         |
| Older versions          | ❌         |

If you are using an unsupported version, please upgrade to the latest release.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it using **GitHub Private Vulnerability Reporting**.

### How to report

1. Go to the repository's **Security** tab
2. Click **"Report a vulnerability"**
3. Fill out the private report form and submit

This will create a **private report visible only to maintainers**, allowing us to investigate and fix the issue before any public disclosure.

### What to include

To help us resolve the issue quickly, please include:

* Description of the vulnerability
* Steps to reproduce the issue
* Potential impact
* Any proof-of-concept code or screenshots
* Suggested fix (optional)

> ⚠️ Please avoid opening public issues for security vulnerabilities unless explicitly instructed.

---

## Response Timeline

We aim to respond to vulnerability reports within:

* **48 hours**: Initial acknowledgment
* **5–7 days**: Triage and severity assessment
* **1–2 weeks**: Patch or mitigation (depending on severity)

We will keep reporters informed throughout the process.

---

## Disclosure Policy

We follow a **responsible disclosure** process:

1. The vulnerability is reported privately
2. The team investigates and creates a fix
3. A patch is released
4. Public disclosure is made (if appropriate), with credit to the reporter

We request that reporters do not disclose vulnerabilities publicly until a fix has been released.

---

## Scope

This policy applies to:

* The ByteFight Client repository

---

## Security Best Practices

Contributors are expected to follow these guidelines:

* Do not commit secrets (API keys, tokens, credentials)
* Validate all external inputs
* Use least-privilege principles
* Keep dependencies up to date
* Follow secure coding practices

---

## Recognition

We appreciate responsible disclosure and will acknowledge contributors who report valid vulnerabilities (unless they prefer to remain anonymous).

---

## Contact

For any additional security-related concerns, you may use GitHub Discussions or contact maintainers directly if necessary.

---

Thank you for helping keep ByteFight secure.
