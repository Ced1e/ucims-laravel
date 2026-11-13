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
*/

return [
    // Infectious and parasitic diseases
    'A01.0' => 'Typhoid fever',
    'A09' => 'Infectious gastroenteritis and colitis, unspecified',
    'A09.9' => 'Gastroenteritis and colitis of unspecified origin',
    'A15.0' => 'Tuberculosis of lung',
    'A90' => 'Dengue fever [classical dengue]',
    'A91' => 'Dengue haemorrhagic fever',
    'B01.9' => 'Varicella without complication',
    'B02.9' => 'Zoster without complications',
    'B34.9' => 'Viral infection, unspecified',
    'B35.3' => 'Tinea pedis',
    'B37.0' => 'Candidal stomatitis',
    'B80' => 'Enterobiasis',

    // Endocrine, nutritional and metabolic diseases
    'D50.9' => 'Iron deficiency anaemia, unspecified',
    'E11.9' => 'Type 2 diabetes mellitus without complications',
    'E78.5' => 'Hyperlipidaemia, unspecified',

    // Mental and behavioural disorders
    'F10.20' => 'Alcohol dependence, uncomplicated',
    'F32.9' => 'Major depressive disorder, single episode, unspecified',
    'F41.1' => 'Generalized anxiety disorder',
    'F41.9' => 'Anxiety disorder, unspecified',
    'F43.23' => 'Adjustment disorder with mixed anxiety and depressed mood',
    'F51.01' => 'Primary insomnia',
    'F90.9' => 'Attention-deficit hyperactivity disorder, unspecified type',

    // Nervous system
    'G40.909' => 'Epilepsy, unspecified, not intractable, without status epilepticus',
    'G43.9' => 'Migraine, unspecified',
    'G44.2' => 'Tension-type headache',
    'G47.00' => 'Insomnia, unspecified',

    // Eye and ear
    'H10.9' => 'Conjunctivitis, unspecified',
    'H52.4' => 'Presbyopia',
    'H65.90' => 'Unspecified nonsuppurative otitis media, unspecified ear',
    'H66.9' => 'Otitis media, unspecified',
    'H81.10' => 'Benign paroxysmal vertigo, unspecified ear',

    // Circulatory system
    'I10' => 'Essential (primary) hypertension',

    // Respiratory system
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
    'J45.909' => 'Unspecified asthma, uncomplicated',

    // Digestive system
    'K02.9' => 'Dental caries, unspecified',
    'K04.0' => 'Pulpitis',
    'K12.0' => 'Recurrent oral aphthae',
    'K21.9' => 'Gastro-oesophageal reflux disease without oesophagitis',
    'K29.70' => 'Gastritis, unspecified, without bleeding',
    'K30' => 'Functional dyspepsia',
    'K52.9' => 'Noninfective gastroenteritis and colitis, unspecified',
    'K59.00' => 'Constipation, unspecified',

    // Skin and subcutaneous tissue
    'L01.0' => 'Impetigo',
    'L02.91' => 'Cutaneous abscess, unspecified',
    'L03.90' => 'Cellulitis, unspecified',
    'L20.9' => 'Atopic dermatitis, unspecified',
    'L23.9' => 'Allergic contact dermatitis, unspecified cause',
    'L30.9' => 'Dermatitis, unspecified',
    'L50.9' => 'Urticaria, unspecified',
    'L60.0' => 'Ingrowing nail',

    // Musculoskeletal system
    'M06.9' => 'Rheumatoid arthritis, unspecified',
    'M10.9' => 'Gout, unspecified',
    'M17.9' => 'Gonarthrosis, unspecified',
    'M19.90' => 'Unspecified osteoarthritis, unspecified site',
    'M25.50' => 'Pain in unspecified joint',
    'M54.2' => 'Cervicalgia',
    'M54.5' => 'Low back pain',
    'M62.81' => 'Muscle weakness (generalized)',
    'M75.100' => 'Unspecified rotator cuff tear or rupture, not specified as traumatic',
    'M79.1' => 'Myalgia',
    'M79.2' => 'Neuralgia and neuritis, unspecified',

    // Genitourinary system
    'N10' => 'Acute tubulo-interstitial nephritis',
    'N20.0' => 'Calculus of kidney',
    'N30.00' => 'Acute cystitis without haematuria',
    'N39.0' => 'Urinary tract infection, site not specified',
    'N94.6' => 'Dysmenorrhoea, unspecified',

    // Pregnancy, childbirth and the puerperium
    'O26.899' => 'Other specified pregnancy related conditions, unspecified trimester',

    // Symptoms, signs and abnormal findings
    'R05' => 'Cough',
    'R07.9' => 'Chest pain, unspecified',
    'R10.9' => 'Unspecified abdominal pain',
    'R11.2' => 'Nausea with vomiting, unspecified',
    'R21' => 'Rash and other nonspecific skin eruption',
    'R42' => 'Dizziness and giddiness',
    'R50.9' => 'Fever, unspecified',
    'R51' => 'Headache',
    'R53.83' => 'Other fatigue',
    'R56.9' => 'Unspecified convulsions',
    'R68.89' => 'Other general symptoms and signs',

    // Injury, poisoning and external causes
    'S00.03XA' => 'Contusion of scalp, initial encounter',
    'S52.501A' => 'Unspecified fracture of the lower end of right radius, initial encounter',
    'S93.401A' => 'Sprain of unspecified ligament of right ankle, initial encounter',
    'T14.90XA' => 'Injury, unspecified, initial encounter',
    'T78.40XA' => 'Allergy, unspecified, initial encounter',

    // Factors influencing health status
    'Z00.00' => 'Encounter for general adult medical examination without abnormal findings',
    'Z23' => 'Encounter for immunization',
    'Z72.0' => 'Tobacco use',
];
