import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = 'dev-key-no-auth-needed'
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    IP_SERVICES = [
        'https://api.ipify.org?format=json',
        'https://ipinfo.io/json',
        'https://api.myip.com',
        'http://ip-api.com/json'
    ]
    
    VPN_ASN_PATTERNS = [
        'AS60068', 'AS20473', 'AS14061', 'AS16276', 'AS12876',
        'AS24940', 'AS26496', 'AS14618', 'AS15169', 'AS8075',
    ]
    
    VPN_PROVIDER_KEYWORDS = [
        'vpn', 'proxy', 'hosting', 'datacenter', 'server', 
        'cloud', 'amazon', 'google', 'microsoft', 'digitalocean',
        'linode', 'vultr', 'ovh', 'hetzner', 'alibaba'
    ]