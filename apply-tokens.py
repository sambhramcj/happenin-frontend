import re
import os

def apply_design_tokens(filepath):
    """Apply design token replacements to a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Background colors
    content = re.sub(r'bg-white(["\s/])', r'bg-bg-card\1', content)
    content = content.replace('bg-gray-50', 'bg-bg-muted')
    content = content.replace('bg-gray-100', 'bg-bg-muted')
    
    # Text colors
    content = content.replace('text-gray-900', 'text-text-primary')
    content = content.replace('text-gray-800', 'text-text-primary')
    content = content.replace('text-gray-700', 'text-text-primary')
    content = content.replace('text-gray-600', 'text-text-secondary')
    content = content.replace('text-gray-500', 'text-text-muted')
    content = re.sub(r'text-white(["\s])', r'text-text-inverse\1', content)
    
    # Borders
    content = content.replace('border-gray-200', 'border-border-default')
    content = content.replace('border-gray-300', 'border-border-default')
    content = content.replace('border-2 border-gray-200', 'border-2 border-border-default')
    
    # Brand colors
    content = re.sub(r'bg-brand(["\s])', r'bg-primary\1', content)
    content = re.sub(r'text-brand(["\s])', r'text-primary\1', content)
    content = content.replace('bg-brand-soft', 'bg-primarySoft')
    content = content.replace('text-brand', 'text-primary')
    content = content.replace('focus:ring-brand', 'focus:ring-primary')
    content = content.replace('focus:border-brand', 'focus:border-primary')
    content = content.replace('border-primary', 'border-primary')
    
    # Hover states
    content = content.replace('hover:bg-violet-800', 'hover:bg-primaryHover')
    content = content.replace('hover:bg-gray-100', 'hover:bg-bg-muted')
    content = content.replace('hover:bg-purple-500/10', 'hover:bg-bg-muted')
    
    # Error states
    content = re.sub(r'text-red-\d+', 'text-error', content)
    content = content.replace('bg-red-50', 'bg-errorSoft')
    content = content.replace('hover:bg-red-600/10', 'hover:bg-errorSoft')
    content = content.replace('bg-red-600', 'bg-error')
    content = content.replace('border-red-500/30', 'border-error')
    
    # Success states
    content = re.sub(r'text-green-\d+', 'text-success', content)
    content = content.replace('bg-green-50', 'bg-successSoft')
    content = content.replace('bg-green-600', 'bg-success')
    content = content.replace('border-green-300', 'border-success')
    content = content.replace('border-green-500/30', 'border-success')
    
    # Warning states
    content = content.replace('text-amber-500', 'text-warning')
    content = content.replace('bg-amber-50', 'bg-warningSoft')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

# Apply to all dashboards
base_path = r'c:\Users\C J Sambhram\Desktop\happenin\frontend\src\app\dashboard'
files = [
    os.path.join(base_path, 'student', 'page.tsx'),
    os.path.join(base_path, 'organizer', 'page.tsx'),
    os.path.join(base_path, 'admin', 'page.tsx'),
]

for filepath in files:
    if os.path.exists(filepath):
        apply_design_tokens(filepath)
        print(f"✓ Updated {os.path.basename(os.path.dirname(filepath))} dashboard")
    else:
        print(f"✗ File not found: {filepath}")

print("\n✅ Design tokens applied successfully!")
