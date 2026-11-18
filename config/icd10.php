<?php

/*
|--------------------------------------------------------------------------
| ICD-10 reference catalogue
|--------------------------------------------------------------------------
|
| A focused list of the conditions commonly seen at the university clinic.
| Doctors can search it by disease name or by code while writing a
| diagnosis, and the admin illness statistics use the same labels.
| Keys are ICD-10 codes; values are the official descriptions.
|
| The list is grouped by ICD-10 chapter so every body system in the
| reports tree (Infectious through Health services) has at least one
| standardized condition behind it, even before the clinic records it.
|
*/

return [
    // Infectious and parasitic diseases (A00-B99)
    'A01.0' => 'Typhoid fever',
    'A06.9' => 'Amoebiasis, unspecified',
    'A09' => 'Infectious gastroenteritis and colitis, unspecified',
    'A09.9' => 'Gastroenteritis and colitis of unspecified origin',
    'A15.0' => 'Tuberculosis of lung',
    'A46' => 'Erysipelas',
    'A69.20' => 'Lyme disease, unspecified',
    'A90' => 'Dengue fever [classical dengue]',
    'A91' => 'Dengue haemorrhagic fever',
    'B01.9' => 'Varicella without complication',
    'B02.9' => 'Zoster without complications',
    'B05.9' => 'Measles without complication',
    'B06.9' => 'Rubella without complication',
    'B07' => 'Viral warts',
    'B08.4' => 'Enteroviral vesicular stomatitis with exanthem',
    'B16.9' => 'Acute hepatitis B without delta-agent and without hepatic coma',
    'B18.2' => 'Chronic viral hepatitis C',
    'B26.9' => 'Mumps without complication',
    'B34.9' => 'Viral infection, unspecified',
    'B35.3' => 'Tinea pedis',
    'B37.0' => 'Candidal stomatitis',
    'B54' => 'Unspecified malaria',
    'B80' => 'Enterobiasis',
    'B86' => 'Scabies',

    // Neoplasms (C00-D48)
    'C18.9' => 'Malignant neoplasm of colon, unspecified',
    'C34.90' => 'Malignant neoplasm of unspecified part of unspecified bronchus or lung',
    'C43.9' => 'Malignant melanoma of skin, unspecified',
    'C50.919' => 'Malignant neoplasm of unspecified site of unspecified female breast',
    'C53.9' => 'Malignant neoplasm of cervix uteri, unspecified',
    'C61' => 'Malignant neoplasm of prostate',
    'C73' => 'Malignant neoplasm of thyroid gland',
    'C95.90' => 'Leukemia, unspecified',
    'D25.9' => 'Leiomyoma of uterus, unspecified',
    'D48.9' => 'Neoplasm of uncertain behavior, unspecified',

    // Diseases of the blood and immune system (D50-D89)
    'D50.9' => 'Iron deficiency anaemia, unspecified',
    'D56.9' => 'Thalassaemia, unspecified',
    'D68.9' => 'Coagulation defect, unspecified',
    'D69.6' => 'Thrombocytopenia, unspecified',
    'D84.9' => 'Immunodeficiency, unspecified',

    // Endocrine, nutritional and metabolic diseases (E00-E90)
    'E03.9' => 'Hypothyroidism, unspecified',
    'E05.90' => 'Thyrotoxicosis, unspecified',
    'E11.9' => 'Type 2 diabetes mellitus without complications',
    'E28.2' => 'Polycystic ovarian syndrome',
    'E55.9' => 'Vitamin D deficiency, unspecified',
    'E66.9' => 'Obesity, unspecified',
    'E78.5' => 'Hyperlipidaemia, unspecified',

    // Mental and behavioural disorders (F00-F99)
    'F03.90' => 'Unspecified dementia without behavioral disturbance',
    'F10.20' => 'Alcohol dependence, uncomplicated',
    'F19.20' => 'Other psychoactive substance dependence, uncomplicated',
    'F31.9' => 'Bipolar disorder, unspecified',
    'F32.9' => 'Major depressive disorder, single episode, unspecified',
    'F41.0' => 'Panic disorder [episodic paroxysmal anxiety]',
    'F41.1' => 'Generalized anxiety disorder',
    'F41.9' => 'Anxiety disorder, unspecified',
    'F43.23' => 'Adjustment disorder with mixed anxiety and depressed mood',
    'F51.01' => 'Primary insomnia',
    'F90.9' => 'Attention-deficit hyperactivity disorder, unspecified type',

    // Diseases of the nervous system (G00-G99)
    'G03.9' => 'Meningitis, unspecified',
    'G20' => 'Parkinson disease',
    'G35' => 'Multiple sclerosis',
    'G40.909' => 'Epilepsy, unspecified, not intractable, without status epilepticus',
    'G43.9' => 'Migraine, unspecified',
    'G44.2' => 'Tension-type headache',
    'G47.00' => 'Insomnia, unspecified',
    'G51.0' => 'Bell\'s palsy',
    'G56.00' => 'Carpal tunnel syndrome, unspecified upper limb',
    'G62.9' => 'Polyneuropathy, unspecified',

    // Diseases of the eye and ear (H00-H95)
    'H01.00' => 'Unspecified blepharitis',
    'H10.9' => 'Conjunctivitis, unspecified',
    'H25.9' => 'Unspecified senile cataract',
    'H40.9' => 'Unspecified glaucoma',
    'H52.1' => 'Myopia',
    'H52.4' => 'Presbyopia',
    'H65.90' => 'Unspecified nonsuppurative otitis media, unspecified ear',
    'H66.9' => 'Otitis media, unspecified',
    'H81.10' => 'Benign paroxysmal vertigo, unspecified ear',
    'H91.90' => 'Unspecified hearing loss, unspecified ear',
    'H92.09' => 'Otalgia, unspecified ear',

    // Diseases of the circulatory system (I00-I99)
    'I10' => 'Essential (primary) hypertension',
    'I25.10' => 'Atherosclerotic heart disease of native coronary artery without angina pectoris',
    'I48.91' => 'Unspecified atrial fibrillation',
    'I50.9' => 'Heart failure, unspecified',
    'I64' => 'Stroke, not specified as haemorrhage or infarction',
    'I83.90' => 'Asymptomatic varicose veins of unspecified lower extremity',
    'I95.9' => 'Hypotension, unspecified',

    // Diseases of the respiratory system (J00-J99)
    'J00' => 'Acute nasopharyngitis [common cold]',
    'J01.9' => 'Acute sinusitis, unspecified',
    'J02.0' => 'Streptococcal pharyngitis',
    'J02.9' => 'Acute pharyngitis, unspecified',
    'J03.0' => 'Streptococcal tonsillitis',
    'J03.9' => 'Acute tonsillitis, unspecified',
    'J04.0' => 'Acute laryngitis',
    'J05.0' => 'Acute obstructive laryngitis [croup]',
    'J06.9' => 'Acute upper respiratory infection, unspecified',
    'J18.0' => 'Bronchopneumonia, unspecified organism',
    'J18.9' => 'Pneumonia, unspecified organism',
    'J20.9' => 'Acute bronchitis, unspecified',
    'J30.1' => 'Allergic rhinitis due to pollen',
    'J31.0' => 'Chronic rhinitis',
    'J32.9' => 'Chronic sinusitis, unspecified',
    'J35.01' => 'Chronic tonsillitis',
    'J44.9' => 'Chronic obstructive pulmonary disease, unspecified',
    'J45.909' => 'Unspecified asthma, uncomplicated',

    // Diseases of the digestive system (K00-K93)
    'K02.9' => 'Dental caries, unspecified',
    'K04.0' => 'Pulpitis',
    'K12.0' => 'Recurrent oral aphthae',
    'K21.9' => 'Gastro-oesophageal reflux disease without oesophagitis',
    'K29.70' => 'Gastritis, unspecified, without bleeding',
    'K30' => 'Functional dyspepsia',
    'K35.80' => 'Unspecified acute appendicitis',
    'K40.90' => 'Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent',
    'K52.9' => 'Noninfective gastroenteritis and colitis, unspecified',
    'K59.00' => 'Constipation, unspecified',
    'K63.5' => 'Polyp of colon',
    'K64.9' => 'Unspecified haemorrhoids',
    'K80.20' => 'Calculus of gallbladder without cholecystitis without obstruction',

    // Diseases of the skin and subcutaneous tissue (L00-L99)
    'L01.0' => 'Impetigo',
    'L02.91' => 'Cutaneous abscess, unspecified',
    'L03.90' => 'Cellulitis, unspecified',
    'L20.9' => 'Atopic dermatitis, unspecified',
    'L21.9' => 'Seborrheic dermatitis, unspecified',
    'L23.9' => 'Allergic contact dermatitis, unspecified cause',
    'L30.9' => 'Dermatitis, unspecified',
    'L40.9' => 'Psoriasis, unspecified',
    'L50.9' => 'Urticaria, unspecified',
    'L60.0' => 'Ingrowing nail',
    'L70.0' => 'Acne vulgaris',
    'L80' => 'Vitiligo',
    'L89.90' => 'Pressure ulcer of unspecified site, unspecified stage',

    // Diseases of the musculoskeletal system (M00-M99)
    'M06.9' => 'Rheumatoid arthritis, unspecified',
    'M10.9' => 'Gout, unspecified',
    'M17.9' => 'Gonarthrosis, unspecified',
    'M19.90' => 'Unspecified osteoarthritis, unspecified site',
    'M25.50' => 'Pain in unspecified joint',
    'M54.2' => 'Cervicalgia',
    'M54.30' => 'Sciatica, unspecified side',
    'M54.5' => 'Low back pain',
    'M62.81' => 'Muscle weakness (generalized)',
    'M75.100' => 'Unspecified rotator cuff tear or rupture, not specified as traumatic',
    'M79.1' => 'Myalgia',
    'M79.2' => 'Neuralgia and neuritis, unspecified',
    'M79.7' => 'Fibromyalgia',
    'M81.0' => 'Age-related osteoporosis without current pathological fracture',

    // Diseases of the genitourinary system (N00-N99)
    'N10' => 'Acute tubulo-interstitial nephritis',
    'N18.9' => 'Chronic kidney disease, unspecified',
    'N19' => 'Unspecified kidney failure',
    'N20.0' => 'Calculus of kidney',
    'N30.00' => 'Acute cystitis without haematuria',
    'N39.0' => 'Urinary tract infection, site not specified',
    'N40' => 'Hyperplasia of prostate',
    'N76.0' => 'Acute vaginitis',
    'N94.6' => 'Dysmenorrhoea, unspecified',
    'N95.1' => 'Menopausal and female climacteric states',

    // Pregnancy, childbirth and the puerperium (O00-O99)
    'O14.90' => 'Unspecified pre-eclampsia, unspecified trimester',
    'O21.0' => 'Mild hyperemesis gravidarum',
    'O24.419' => 'Gestational diabetes mellitus in pregnancy, unspecified control',
    'O26.899' => 'Other specified pregnancy related conditions, unspecified trimester',
    'O47.9' => 'False labour, unspecified',
    'O80' => 'Encounter for full-term uncomplicated delivery',

    // Certain conditions originating in the perinatal period (P00-P96)
    'P07.30' => 'Preterm newborn, unspecified weeks of gestation',
    'P21.9' => 'Birth asphyxia, unspecified',
    'P36.9' => 'Bacterial sepsis of newborn, unspecified',
    'P59.9' => 'Neonatal jaundice, unspecified',
    'P92.9' => 'Feeding problem of newborn, unspecified',

    // Congenital malformations and chromosomal abnormalities (Q00-Q99)
    'Q21.0' => 'Ventricular septal defect',
    'Q35.9' => 'Cleft palate, unspecified',
    'Q53.9' => 'Undescended testicle, unspecified',
    'Q66.89' => 'Other specified congenital deformities of feet',
    'Q90.9' => 'Down syndrome, unspecified',

    // Symptoms, signs and abnormal findings (R00-R99)
    'R00.2' => 'Palpitations',
    'R05' => 'Cough',
    'R06.00' => 'Dyspnea, unspecified',
    'R07.9' => 'Chest pain, unspecified',
    'R10.9' => 'Unspecified abdominal pain',
    'R11.2' => 'Nausea with vomiting, unspecified',
    'R17' => 'Unspecified jaundice',
    'R21' => 'Rash and other nonspecific skin eruption',
    'R42' => 'Dizziness and giddiness',
    'R50.9' => 'Fever, unspecified',
    'R51' => 'Headache',
    'R53.83' => 'Other fatigue',
    'R55' => 'Syncope and collapse',
    'R56.9' => 'Unspecified convulsions',
    'R60.9' => 'Oedema, unspecified',
    'R63.4' => 'Abnormal weight loss',
    'R68.89' => 'Other general symptoms and signs',

    // Injury, poisoning and external causes (S00-T98)
    'S00.03XA' => 'Contusion of scalp, initial encounter',
    'S01.91XA' => 'Laceration of unspecified part of head, initial encounter',
    'S06.0X0A' => 'Concussion without loss of consciousness, initial encounter',
    'S52.501A' => 'Unspecified fracture of the lower end of right radius, initial encounter',
    'S93.401A' => 'Sprain of unspecified ligament of right ankle, initial encounter',
    'T14.90XA' => 'Injury, unspecified, initial encounter',
    'T15.90XA' => 'Foreign body on external eye, part unspecified, unspecified eye, initial encounter',
    'T30.0' => 'Burn of unspecified body region, unspecified degree',
    'T78.40XA' => 'Allergy, unspecified, initial encounter',

    // Factors influencing health status (Z00-Z99)
    'Z00.00' => 'Encounter for general adult medical examination without abnormal findings',
    'Z02.79' => 'Encounter for issue of other medical certificate',
    'Z09' => 'Encounter for follow-up examination after completed treatment for conditions other than malignant neoplasm',
    'Z13.9' => 'Encounter for screening, unspecified',
    'Z23' => 'Encounter for immunization',
    'Z30.9' => 'Encounter for contraceptive management, unspecified',
    'Z34.90' => 'Encounter for supervision of normal pregnancy, unspecified, unspecified trimester',
    'Z39.2' => 'Encounter for routine postpartum follow-up',
    'Z71.9' => 'Counselling, unspecified',
    'Z72.0' => 'Tobacco use',
];
