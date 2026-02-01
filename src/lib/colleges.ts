/**
 * Indian Colleges Database
 * Comprehensive list of colleges/universities with focus on Karnataka institutions
 */

export interface College {
  name: string;
  location: string;
  state: string;
}

export const INDIAN_COLLEGES: College[] = [
  // ===== TOP 50 ENGINEERING COLLEGES IN KARNATAKA =====
  { name: "PES University", location: "Bangalore", state: "Karnataka" },
  { name: "RV College of Engineering", location: "Bangalore", state: "Karnataka" },
  { name: "BMS College of Engineering", location: "Bangalore", state: "Karnataka" },
  { name: "Dayananda Sagar College of Engineering", location: "Bangalore", state: "Karnataka" },
  { name: "MS Ramaiah Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "BMS Institute of Technology and Management", location: "Bangalore", state: "Karnataka" },
  { name: "Sir M. Visvesvaraya Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Manipal Institute of Technology", location: "Manipal", state: "Karnataka" },
  { name: "The National Institute of Engineering", location: "Mysore", state: "Karnataka" },
  { name: "JSS Science and Technology University", location: "Mysore", state: "Karnataka" },
  { name: "Ramaiah University of Applied Sciences", location: "Bangalore", state: "Karnataka" },
  { name: "KLE Technological University", location: "Hubballi", state: "Karnataka" },
  { name: "Siddaganga Institute of Technology", location: "Tumkur", state: "Karnataka" },
  { name: "Nitte Meenakshi Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Bangalore Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Acharya Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Dr. Ambedkar Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "CMR Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Global Academy of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Atria Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "East Point College of Engineering and Technology", location: "Bangalore", state: "Karnataka" },
  { name: "AMC Engineering College", location: "Bangalore", state: "Karnataka" },
  { name: "BGS Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Proudhadevaraya Institute of Technology", location: "Hospet", state: "Karnataka" },
  { name: "Rajeev Institute of Technology", location: "Hassan", state: "Karnataka" },
  { name: "SDM College of Engineering and Technology", location: "Dharwad", state: "Karnataka" },
  { name: "Shri Madhwa Vadiraja Institute of Technology", location: "Bantakal", state: "Karnataka" },
  { name: "SJB Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "NMAM Institute of Technology", location: "Nitte", state: "Karnataka" },
  { name: "Canara Engineering College", location: "Mangalore", state: "Karnataka" },
  { name: "PA College of Engineering", location: "Mangalore", state: "Karnataka" },
  { name: "Shri Dharmasthala Manjunatheshwara College of Engineering", location: "Dharwad", state: "Karnataka" },
  { name: "Nagarjuna College of Engineering and Technology", location: "Bangalore", state: "Karnataka" },
  { name: "New Horizon College of Engineering", location: "Bangalore", state: "Karnataka" },
  { name: "Oxford College of Engineering", location: "Bangalore", state: "Karnataka" },
  { name: "Reva University", location: "Bangalore", state: "Karnataka" },
  { name: "Cambridge Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Sapthagiri College of Engineering", location: "Bangalore", state: "Karnataka" },
  { name: "Dayananda Sagar Academy of Technology and Management", location: "Bangalore", state: "Karnataka" },
  { name: "RNS Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Vidyavardhaka College of Engineering", location: "Mysore", state: "Karnataka" },
  { name: "Malnad College of Engineering", location: "Hassan", state: "Karnataka" },
  { name: "GSSS Institute of Engineering and Technology for Women", location: "Mysore", state: "Karnataka" },
  { name: "Basaveshwar Engineering College", location: "Bagalkot", state: "Karnataka" },
  { name: "Gopalan College of Engineering and Management", location: "Bangalore", state: "Karnataka" },
  { name: "Government Engineering College Hassan", location: "Hassan", state: "Karnataka" },
  { name: "Government Engineering College Ramanagaram", location: "Ramanagaram", state: "Karnataka" },
  { name: "Government Engineering College Chamarajanagar", location: "Chamarajanagar", state: "Karnataka" },
  { name: "KS Institute of Technology", location: "Bangalore", state: "Karnataka" },
  { name: "Don Bosco Institute of Technology", location: "Bangalore", state: "Karnataka" },

  // ===== TOP 50 MEDICAL COLLEGES IN KARNATAKA =====
  { name: "Kasturba Medical College Manipal", location: "Manipal", state: "Karnataka" },
  { name: "St. John's Medical College", location: "Bangalore", state: "Karnataka" },
  { name: "Bangalore Medical College and Research Institute", location: "Bangalore", state: "Karnataka" },
  { name: "Mysore Medical College and Research Institute", location: "Mysore", state: "Karnataka" },
  { name: "Kasturba Medical College Mangalore", location: "Mangalore", state: "Karnataka" },
  { name: "JSS Medical College", location: "Mysore", state: "Karnataka" },
  { name: "MS Ramaiah Medical College", location: "Bangalore", state: "Karnataka" },
  { name: "Kempegowda Institute of Medical Sciences", location: "Bangalore", state: "Karnataka" },
  { name: "Father Muller Medical College", location: "Mangalore", state: "Karnataka" },
  { name: "AJ Institute of Medical Sciences", location: "Mangalore", state: "Karnataka" },
  { name: "Yenepoya Medical College", location: "Mangalore", state: "Karnataka" },
  { name: "KMC Hubli - Karnataka Institute of Medical Sciences", location: "Hubli", state: "Karnataka" },
  { name: "SDM College of Medical Sciences and Hospital", location: "Dharwad", state: "Karnataka" },
  { name: "SS Institute of Medical Sciences and Research Centre", location: "Davangere", state: "Karnataka" },
  { name: "Vydehi Institute of Medical Sciences and Research Centre", location: "Bangalore", state: "Karnataka" },
  { name: "MVJ Medical College and Research Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "Rajarajeswari Medical College and Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "BGS Global Institute of Medical Sciences", location: "Bangalore", state: "Karnataka" },
  { name: "East Point College of Medical Sciences and Research Centre", location: "Bangalore", state: "Karnataka" },
  { name: "Sapthagiri Institute of Medical Sciences and Research Centre", location: "Bangalore", state: "Karnataka" },
  { name: "Sri Siddhartha Medical College", location: "Tumkur", state: "Karnataka" },
  { name: "Adichunchanagiri Institute of Medical Sciences", location: "Bellur", state: "Karnataka" },
  { name: "JJM Medical College", location: "Davangere", state: "Karnataka" },
  { name: "Shridevi Institute of Medical Sciences and Research Hospital", location: "Tumkur", state: "Karnataka" },
  { name: "KVG Medical College and Hospital", location: "Sullia", state: "Karnataka" },
  { name: "Kanachur Institute of Medical Sciences", location: "Mangalore", state: "Karnataka" },
  { name: "BLDE University Shri B M Patil Medical College", location: "Vijayapura", state: "Karnataka" },
  { name: "Gadag Institute of Medical Sciences", location: "Gadag", state: "Karnataka" },
  { name: "Shimoga Institute of Medical Sciences", location: "Shimoga", state: "Karnataka" },
  { name: "Karnataka Institute of Medical Sciences Hubballi", location: "Hubballi", state: "Karnataka" },
  { name: "Hassan Institute of Medical Sciences", location: "Hassan", state: "Karnataka" },
  { name: "Kodagu Institute of Medical Sciences", location: "Madikeri", state: "Karnataka" },
  { name: "Navodaya Medical College", location: "Raichur", state: "Karnataka" },
  { name: "Khaja Bandanawaz Institute of Medical Sciences", location: "Gulbarga", state: "Karnataka" },
  { name: "Raichur Institute of Medical Sciences", location: "Raichur", state: "Karnataka" },
  { name: "MR Medical College", location: "Gulbarga", state: "Karnataka" },
  { name: "Sri Devaraj Urs Medical College", location: "Kolar", state: "Karnataka" },
  { name: "Al-Ameen Medical College", location: "Vijayapura", state: "Karnataka" },
  { name: "Akash Institute of Medical Sciences and Research Centre", location: "Bangalore", state: "Karnataka" },
  { name: "Oxford Medical College Hospital and Research Centre", location: "Bangalore", state: "Karnataka" },
  { name: "Subbaiah Institute of Medical Sciences", location: "Shimoga", state: "Karnataka" },
  { name: "Mysore Medical College Hospital and Research Institute", location: "Mysore", state: "Karnataka" },
  { name: "BGS Global Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "Columbia Asia Referral Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "Fortis Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "Apollo Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "Manipal Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "Narayana Health City", location: "Bangalore", state: "Karnataka" },
  { name: "Aster CMI Hospital", location: "Bangalore", state: "Karnataka" },
  { name: "Sakra World Hospital", location: "Bangalore", state: "Karnataka" },

  // ===== TOP 10 ARCHITECTURE COLLEGES =====
  { name: "BMS College of Architecture", location: "Bangalore", state: "Karnataka" },
  { name: "MS Ramaiah School of Architecture", location: "Bangalore", state: "Karnataka" },
  { name: "RV College of Architecture", location: "Bangalore", state: "Karnataka" },
  { name: "Dayananda Sagar College of Architecture", location: "Bangalore", state: "Karnataka" },
  { name: "Acharya School of Architecture", location: "Bangalore", state: "Karnataka" },
  { name: "PES University School of Architecture", location: "Bangalore", state: "Karnataka" },
  { name: "School of Planning and Architecture Bhopal", location: "Bhopal", state: "Madhya Pradesh" },
  { name: "School of Planning and Architecture Delhi", location: "New Delhi", state: "Delhi" },
  { name: "Sir JJ College of Architecture", location: "Mumbai", state: "Maharashtra" },
  { name: "CEPT University", location: "Ahmedabad", state: "Gujarat" },

  // ===== TOP 10 LAW COLLEGES =====
  { name: "National Law School of India University", location: "Bangalore", state: "Karnataka" },
  { name: "NALSAR University of Law", location: "Hyderabad", state: "Telangana" },
  { name: "National Law University Delhi", location: "New Delhi", state: "Delhi" },
  { name: "West Bengal National University of Juridical Sciences", location: "Kolkata", state: "West Bengal" },
  { name: "National Law Institute University", location: "Bhopal", state: "Madhya Pradesh" },
  { name: "Gujarat National Law University", location: "Gandhinagar", state: "Gujarat" },
  { name: "Rajiv Gandhi National University of Law", location: "Patiala", state: "Punjab" },
  { name: "Symbiosis Law School Pune", location: "Pune", state: "Maharashtra" },
  { name: "Jindal Global Law School", location: "Sonipat", state: "Haryana" },
  { name: "ILS Law College", location: "Pune", state: "Maharashtra" },

  // ===== TOP 10 BUSINESS & MANAGEMENT COLLEGES =====
  { name: "IIM Bangalore", location: "Bangalore", state: "Karnataka" },
  { name: "IIM Ahmedabad", location: "Ahmedabad", state: "Gujarat" },
  { name: "IIM Calcutta", location: "Kolkata", state: "West Bengal" },
  { name: "IIM Lucknow", location: "Lucknow", state: "Uttar Pradesh" },
  { name: "IIM Kozhikode", location: "Kozhikode", state: "Kerala" },
  { name: "IIM Indore", location: "Indore", state: "Madhya Pradesh" },
  { name: "XLRI Jamshedpur", location: "Jamshedpur", state: "Jharkhand" },
  { name: "FMS Delhi", location: "New Delhi", state: "Delhi" },
  { name: "NMIMS Mumbai", location: "Mumbai", state: "Maharashtra" },
  { name: "Symbiosis Institute of Business Management", location: "Pune", state: "Maharashtra" },

  // ===== 10 COLLEGES OF OTHER DEGREES =====
  { name: "Christ University", location: "Bangalore", state: "Karnataka" },
  { name: "St. Joseph's College", location: "Bangalore", state: "Karnataka" },
  { name: "Mount Carmel College", location: "Bangalore", state: "Karnataka" },
  { name: "Jyoti Nivas College", location: "Bangalore", state: "Karnataka" },
  { name: "Presidency College", location: "Bangalore", state: "Karnataka" },
  { name: "St. Xavier's College Mumbai", location: "Mumbai", state: "Maharashtra" },
  { name: "Loyola College Chennai", location: "Chennai", state: "Tamil Nadu" },
  { name: "St. Stephen's College", location: "New Delhi", state: "Delhi" },
  { name: "Hindu College Delhi", location: "New Delhi", state: "Delhi" },
  { name: "Fergusson College Pune", location: "Pune", state: "Maharashtra" },

  // ===== TOP 10 IITs IN INDIA =====
  { name: "IIT Bombay", location: "Mumbai", state: "Maharashtra" },
  { name: "IIT Delhi", location: "New Delhi", state: "Delhi" },
  { name: "IIT Madras", location: "Chennai", state: "Tamil Nadu" },
  { name: "IIT Kanpur", location: "Kanpur", state: "Uttar Pradesh" },
  { name: "IIT Kharagpur", location: "Kharagpur", state: "West Bengal" },
  { name: "IIT Roorkee", location: "Roorkee", state: "Uttarakhand" },
  { name: "IIT Guwahati", location: "Guwahati", state: "Assam" },
  { name: "IIT Hyderabad", location: "Hyderabad", state: "Telangana" },
  { name: "IIT Dharwad", location: "Dharwad", state: "Karnataka" },
  { name: "IIT BHU Varanasi", location: "Varanasi", state: "Uttar Pradesh" },

  // ===== TOP 10 NITs IN INDIA =====
  { name: "NIT Trichy", location: "Tiruchirappalli", state: "Tamil Nadu" },
  { name: "NIT Surathkal", location: "Mangalore", state: "Karnataka" },
  { name: "NIT Warangal", location: "Warangal", state: "Telangana" },
  { name: "NIT Rourkela", location: "Rourkela", state: "Odisha" },
  { name: "NIT Calicut", location: "Kozhikode", state: "Kerala" },
  { name: "NIT Durgapur", location: "Durgapur", state: "West Bengal" },
  { name: "MNNIT Allahabad", location: "Prayagraj", state: "Uttar Pradesh" },
  { name: "VNIT Nagpur", location: "Nagpur", state: "Maharashtra" },
  { name: "MNIT Jaipur", location: "Jaipur", state: "Rajasthan" },
  { name: "NIT Kurukshetra", location: "Kurukshetra", state: "Haryana" },

  // ===== OTHER MAJOR UNIVERSITIES & COLLEGES =====
  { name: "Bangalore University", location: "Bangalore", state: "Karnataka" },
  { name: "Visvesvaraya Technological University", location: "Belgaum", state: "Karnataka" },
  { name: "University of Mysore", location: "Mysore", state: "Karnataka" },
  { name: "Mangalore University", location: "Mangalore", state: "Karnataka" },
  { name: "Karnatak University", location: "Dharwad", state: "Karnataka" },
  { name: "Jain University", location: "Bangalore", state: "Karnataka" },
  { name: "Azim Premji University", location: "Bangalore", state: "Karnataka" },
  { name: "IIIT Bangalore", location: "Bangalore", state: "Karnataka" },
  { name: "Jawaharlal Nehru University", location: "New Delhi", state: "Delhi" },
  { name: "University of Delhi", location: "New Delhi", state: "Delhi" },
  { name: "University of Mumbai", location: "Mumbai", state: "Maharashtra" },
  { name: "University of Pune", location: "Pune", state: "Maharashtra" },
  { name: "Anna University", location: "Chennai", state: "Tamil Nadu" },
  { name: "University of Hyderabad", location: "Hyderabad", state: "Telangana" },
  { name: "Osmania University", location: "Hyderabad", state: "Telangana" },
  { name: "Jadavpur University", location: "Kolkata", state: "West Bengal" },
  { name: "Banaras Hindu University", location: "Varanasi", state: "Uttar Pradesh" },
  { name: "Aligarh Muslim University", location: "Aligarh", state: "Uttar Pradesh" },
  { name: "University of Calcutta", location: "Kolkata", state: "West Bengal" },
  { name: "Jamia Millia Islamia", location: "New Delhi", state: "Delhi" },
];

/**
 * Get all unique states
 */
export function getAllStates(): string[] {
  return Array.from(new Set(INDIAN_COLLEGES.map((c) => c.state))).sort();
}

/**
 * Search colleges by name, location, or state
 */
export function searchColleges(query: string): College[] {
  if (!query || query.trim().length === 0) {
    return INDIAN_COLLEGES;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  return INDIAN_COLLEGES.filter((college) =>
    college.name.toLowerCase().includes(lowerQuery) ||
    college.location.toLowerCase().includes(lowerQuery) ||
    college.state.toLowerCase().includes(lowerQuery)
  );
}
