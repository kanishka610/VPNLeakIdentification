import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from config import Config

class VPNDetector:
    def __init__(self):
        self.config = Config()
    
    def get_public_ip(self):
        ips = []
        
        def fetch_ip(service):
            try:
                response = requests.get(service, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if 'ip' in data:
                        return data['ip']
                    elif 'query' in data:
                        return data['query']
            except:
                return None
        
        with ThreadPoolExecutor(max_workers=len(self.config.IP_SERVICES)) as executor:
            future_to_service = {
                executor.submit(fetch_ip, service): service 
                for service in self.config.IP_SERVICES
            }
            
            for future in as_completed(future_to_service):
                ip = future.result()
                if ip:
                    ips.append(ip)
        
        if ips:
            return max(set(ips), key=ips.count)
        return None
    
    def get_ip_info(self, ip_address):
        try:
            response = requests.get(f'https://ipinfo.io/{ip_address}/json', timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        
        try:
            response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    'ip': data.get('query', ip_address),
                    'city': data.get('city'),
                    'region': data.get('regionName'),
                    'country': data.get('country'),
                    'org': data.get('org'),
                    'asn': data.get('as'),
                }
        except:
            pass
        
        return None
    
    def is_vpn_detected(self, ip_info):
        if not ip_info:
            return False
        
        org = ip_info.get('org', '').lower()
        asn = ip_info.get('asn', '')
        
        for pattern in self.config.VPN_ASN_PATTERNS:
            if pattern in asn:
                return True
        
        for keyword in self.config.VPN_PROVIDER_KEYWORDS:
            if keyword in org:
                return True
        
        return False
    
    def detect_vpn_leak(self):
        result = {
            'public_ip': None,
            'is_vpn_detected': False,
            'ip_info': {},
            'leak_detected': False,
            'timestamp': None
        }
        
        try:
            public_ip = self.get_public_ip()
            result['public_ip'] = public_ip
            
            if public_ip:
                ip_info = self.get_ip_info(public_ip)
                result['ip_info'] = ip_info
                
                is_vpn = self.is_vpn_detected(ip_info)
                result['is_vpn_detected'] = is_vpn
                
                if is_vpn:
                    result['leak_detected'] = True
            
            result['timestamp'] = datetime.now().isoformat()
            
        except Exception as e:
            result['error'] = str(e)
        
        return result