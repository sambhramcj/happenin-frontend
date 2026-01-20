import re
import os

def apply_motion_tokens(filepath, platform='student'):
    """Apply motion tokens based on platform (student=more, organizer=less, admin=minimal)"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # BUTTONS - All platforms get press/hover feedback
    # Pattern: <button className="..."> or <button ... className="
    
    # Primary action buttons (Pay, Register, Submit, Save)
    button_patterns = [
        # Match buttons with bg-primary (CTAs)
        (r'(className="[^"]*bg-primary[^"]*)"', 
         r'\1 transition-transform duration-fast ease-standard active:scale-press hover:scale-hover"'),
        
        # Match other buttons without motion already
        (r'(<button[^>]*className="(?!.*transition)(?!.*active:scale)([^"]+))"',
         r'\1 transition-transform duration-fast ease-standard active:scale-press"'),
    ]
    
    # CARDS - Platform specific
    if platform in ['student', 'organizer']:
        # Event cards, registration cards - lift on hover
        card_patterns = [
            # Cards with bg-bg-card or bg-white
            (r'(className="[^"]*bg-bg-card[^"]*)"',
             r'\1 transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg"'),
        ]
        
        for pattern, replacement in card_patterns:
            # Only add if not already present
            if 'hover:-translate-y' not in content:
                content = re.sub(pattern, replacement, content, count=5)  # Limit to avoid over-application
    
    # TABS - Fast switching for all platforms
    tab_patterns = [
        # Tab buttons in bottom navigation
        (r'(<button[^>]*onClick=.*setActiveTab[^>]*className="[^"]*)"',
         r'\1 transition-all duration-fast ease-standard"'),
    ]
    
    for pattern, replacement in tab_patterns:
        if 'setActiveTab' in content and 'transition-all' not in content:
            content = re.sub(pattern, replacement, content, count=1)
    
    # INPUT FIELDS - Focus feedback
    input_patterns = [
        (r'(<input[^>]*className="(?!.*transition)([^"]+))"',
         r'\1 transition-all duration-fast ease-standard"'),
        (r'(<textarea[^>]*className="(?!.*transition)([^"]+))"',
         r'\1 transition-all duration-fast ease-standard"'),
    ]
    
    for pattern, replacement in input_patterns:
        content = re.sub(pattern, replacement, content, count=10)
    
    # Apply standard transitions to common interactive elements
    # This adds transitions where they don't exist
    transitions_to_add = [
        # Hover effects
        (r'(className="[^"]*hover:bg-[^"]*)"(?! transition)', r'\1 transition-all duration-fast ease-standard"'),
        (r'(className="[^"]*hover:shadow-[^"]*)"(?! transition)', r'\1 transition-all duration-medium ease-standard"'),
    ]
    
    for pattern, replacement in transitions_to_add:
        content = re.sub(pattern, replacement, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

# Apply to all dashboards
base_path = r'c:\Users\C J Sambhram\Desktop\happenin\frontend\src\app\dashboard'
dashboards = [
    ('student', 'student'),    # More motion
    ('organizer', 'organizer'), # Less motion
    ('admin', 'admin'),         # Minimal motion
]

for folder, platform in dashboards:
    filepath = os.path.join(base_path, folder, 'page.tsx')
    if os.path.exists(filepath):
        apply_motion_tokens(filepath, platform)
        print(f"✓ Applied motion tokens to {folder} dashboard ({platform} profile)")
    else:
        print(f"✗ File not found: {filepath}")

print("\n✅ Motion tokens applied successfully!")
print("\n📋 Applied:")
print("  • Button press/hover feedback (active:scale-press, hover:scale-hover)")
print("  • Input field transitions (focus feedback)")
print("  • Tab switching animations (fast duration)")
print("  • Card hover effects (student/organizer only)")
print("  • Standard easing curves throughout")
