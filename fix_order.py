import sys

with open("pages/Order.tsx", "r") as f:
    content = f.read()

# Fix formData initialization
content = content.replace("mobile: '',", "mobile: [] as string[],")

# Fix formData type if it exists
content = content.replace("mobile: string;", "mobile: string[];")

# Fix sync mobile
old_sync = """  // Sync mobile when parts change
  useEffect(() => {
    setFormData(prev => ({ ...prev, mobile: `${countryCode}${phoneInput}` }));
  }, [countryCode, phoneInput]);"""
new_sync = """  // Sync mobile when parts change
  useEffect(() => {
    const phones = phoneInput.split(',').map(p => p.trim()).filter(Boolean);
    const mobileArray = phones.map(p => p.startsWith('+') ? p : `${countryCode}${p}`);
    setFormData(prev => ({ ...prev, mobile: mobileArray.length > 0 ? mobileArray : [] }));
  }, [countryCode, phoneInput]);"""
content = content.replace(old_sync, new_sync)

# Fix loading existing order
old_load = """          // Attempt to parse mobile number
          const mob = orderToEdit.mobile;
          if (mob.startsWith('+94')) { setCountryCode('+94'); setPhoneInput(mob.replace('+94', '')); }
          else if (mob.startsWith('+1')) { setCountryCode('+1'); setPhoneInput(mob.replace('+1', '')); }
          else if (mob.startsWith('+44')) { setCountryCode('+44'); setPhoneInput(mob.replace('+44', '')); }
          else if (mob.startsWith('+61')) { setCountryCode('+61'); setPhoneInput(mob.replace('+61', '')); }
          else if (mob.startsWith('+91')) { setCountryCode('+91'); setPhoneInput(mob.replace('+91', '')); }
          else if (mob.startsWith('+971')) { setCountryCode('+971'); setPhoneInput(mob.replace('+971', '')); }
          else { setCountryCode(''); setPhoneInput(mob); }"""
new_load = """          // Attempt to parse mobile number
          const mobArray = Array.isArray(orderToEdit.mobile) ? orderToEdit.mobile : (orderToEdit.mobile ? (orderToEdit.mobile as string).split(',') : []);
          const firstMob = mobArray[0] ? mobArray[0].trim() : '';
          if (firstMob.startsWith('+94')) { setCountryCode('+94'); }
          else if (firstMob.startsWith('+1')) { setCountryCode('+1'); }
          else if (firstMob.startsWith('+44')) { setCountryCode('+44'); }
          else if (firstMob.startsWith('+61')) { setCountryCode('+61'); }
          else if (firstMob.startsWith('+91')) { setCountryCode('+91'); }
          else if (firstMob.startsWith('+971')) { setCountryCode('+971'); }
          else { setCountryCode(''); }
          
          setPhoneInput(mobArray.map(m => {
            let num = m.trim();
            if (num.startsWith('+94')) num = num.replace('+94', '');
            else if (num.startsWith('+1')) num = num.replace('+1', '');
            else if (num.startsWith('+44')) num = num.replace('+44', '');
            else if (num.startsWith('+61')) num = num.replace('+61', '');
            else if (num.startsWith('+91')) num = num.replace('+91', '');
            else if (num.startsWith('+971')) num = num.replace('+971', '');
            return num.trim();
          }).join(', '));"""
content = content.replace(old_load, new_load)

# Fix validation
content = content.replace(
    "if (!formData.mobile.trim() || formData.mobile.length < 5) newErrors.mobile = 'Phone number is required';",
    "if (!formData.mobile || formData.mobile.length === 0) newErrors.mobile = 'Phone number is required';"
)

with open("pages/Order.tsx", "w") as f:
    f.write(content)
