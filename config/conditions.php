<?php

/*
|--------------------------------------------------------------------------
| Standardized medical conditions
|--------------------------------------------------------------------------
|
| Free-text diagnoses produce "cough", "Cough", "dry cough", "URI" and
| "upper respiratory tract infection" as four different illnesses in the
| statistics. This catalogue is the single source of truth that maps those
| variations onto ONE standard condition per clinical entity.
|
| Scope: a university clinic. The catalogue deliberately keeps only the
| presentations students actually bring to the clinic — respiratory and
| viral infections, fever and pain, skin and dental problems, injuries,
| mental health, reproductive health and the usual health services.
| Geriatric, oncologic, perinatal and congenital chapters are intentionally
| omitted so the reports tree stays small and relevant. A diagnosis outside
| this list still works: it falls back to its ICD-10 description (grouped by
| code) and is flagged as "not standardized" until it is added here.
|
| Each entry:
|   label   - the standardized condition name shown everywhere
|   code    - the ICD-10 code that represents the condition in statistics
|   codes   - every ICD-10 code that resolves to this condition (optional;
|             defaults to [code]). Equivalent codes are merged here so the
|             statistics stay uniform.
|   aliases - free-text spellings, abbreviations and lay terms recorded by
|             staff. Matched case/punctuation/qualifier insensitively.
|
*/

return [
    // ══ Infectious and parasitic diseases (A00-B99) ═════════════════════
    'typhoid-fever' => [
        'label' => 'Typhoid fever',
        'code' => 'A01.0',
        'aliases' => ['typhoid', 'typhoid fever', 'enteric fever'],
    ],
    'amoebiasis' => [
        'label' => 'Amoebiasis',
        'code' => 'A06.9',
        'aliases' => ['amoebiasis', 'amebiasis', 'amoebic dysentery', 'amebic dysentery'],
    ],
    'gastroenteritis' => [
        'label' => 'Gastroenteritis / diarrhoea',
        'code' => 'A09',
        'codes' => ['A09', 'A09.9', 'K52.9'],
        'aliases' => [
            'gastroenteritis', 'acute gastroenteritis', 'infectious gastroenteritis',
            'gastroenteritis and colitis', 'stomach flu', 'diarrhea', 'diarrhoea',
            'loose stools',
        ],
    ],
    'tuberculosis' => [
        'label' => 'Pulmonary tuberculosis',
        'code' => 'A15.0',
        'aliases' => ['tuberculosis', 'tb', 'ptb', 'pulmonary tuberculosis', 'tuberculosis of lung'],
    ],
    'dengue' => [
        'label' => 'Dengue fever',
        'code' => 'A90',
        'codes' => ['A90', 'A91'],
        'aliases' => [
            'dengue', 'dengue fever', 'dengue hemorrhagic fever', 'dengue haemorrhagic fever',
        ],
    ],
    'varicella' => [
        'label' => 'Varicella (chickenpox)',
        'code' => 'B01.9',
        'aliases' => ['varicella', 'chickenpox', 'chicken pox'],
    ],
    'viral-warts' => [
        'label' => 'Viral warts',
        'code' => 'B07',
        'aliases' => ['viral warts', 'warts', 'wart', 'verruca'],
    ],
    'viral-infection' => [
        'label' => 'Viral infection',
        'code' => 'B34.9',
        'aliases' => [
            'viral infection', 'viral illness', 'viral syndrome', 'virus', 'flu', 'influenza',
        ],
    ],
    'tinea-pedis' => [
        'label' => 'Tinea pedis (athlete\'s foot)',
        'code' => 'B35.3',
        'aliases' => ['tinea pedis', 'athletes foot', 'athlete\'s foot', 'fungal foot infection'],
    ],
    'scabies' => [
        'label' => 'Scabies',
        'code' => 'B86',
        'aliases' => ['scabies', 'scabies infestation', 'mange'],
    ],

    // ══ Blood and immune system (D50-D89) ══════════════════════════════
    'anaemia' => [
        'label' => 'Iron deficiency anaemia',
        'code' => 'D50.9',
        'aliases' => [
            'anemia', 'anaemia', 'iron deficiency anemia', 'iron deficiency anaemia',
            'low hemoglobin', 'low haemoglobin',
        ],
    ],
    'thalassaemia' => [
        'label' => 'Thalassaemia',
        'code' => 'D56.9',
        'aliases' => ['thalassemia', 'thalassaemia'],
    ],

    // ══ Endocrine and metabolic (E00-E90) ══════════════════════════════
    'pcos' => [
        'label' => 'Polycystic ovarian syndrome',
        'code' => 'E28.2',
        'aliases' => ['pcos', 'polycystic ovarian syndrome', 'polycystic ovary syndrome', 'polycystic ovaries'],
    ],
    'obesity' => [
        'label' => 'Obesity',
        'code' => 'E66.9',
        'aliases' => ['obesity', 'obese', 'overweight'],
    ],

    // ══ Mental health (F00-F99) ════════════════════════════════════════
    'depression' => [
        'label' => 'Depressive disorder',
        'code' => 'F32.9',
        'codes' => ['F32.9', 'F43.23'],
        'aliases' => [
            'depression', 'depressive disorder', 'major depressive disorder', 'mdd',
            'low mood', 'adjustment disorder',
        ],
    ],
    'panic-disorder' => [
        'label' => 'Panic disorder',
        'code' => 'F41.0',
        'aliases' => ['panic disorder', 'panic attack', 'panic attacks'],
    ],
    'anxiety' => [
        'label' => 'Anxiety disorder',
        'code' => 'F41.9',
        'codes' => ['F41.9', 'F41.1'],
        'aliases' => [
            'anxiety', 'anxiety disorder', 'generalized anxiety disorder', 'gad',
            'anxious', 'nervousness',
        ],
    ],

    // ══ Nervous system (G00-G99) ══════════════════════════════════════
    'insomnia' => [
        'label' => 'Insomnia',
        'code' => 'F51.01',
        'codes' => ['F51.01', 'G47.00'],
        'aliases' => [
            'insomnia', 'difficulty sleeping', 'poor sleep', 'sleeplessness',
        ],
    ],
    'epilepsy' => [
        'label' => 'Seizure disorder / epilepsy',
        'code' => 'G40.909',
        'codes' => ['G40.909', 'R56.9'],
        'aliases' => [
            'epilepsy', 'seizure', 'seizures', 'seizure disorder', 'convulsion', 'convulsions',
        ],
    ],
    'migraine' => [
        'label' => 'Migraine',
        'code' => 'G43.9',
        'aliases' => ['migraine', 'migraine headache'],
    ],
    'carpal-tunnel' => [
        'label' => 'Carpal tunnel syndrome',
        'code' => 'G56.00',
        'aliases' => ['carpal tunnel', 'carpal tunnel syndrome'],
    ],

    // ══ Eye and ear (H00-H95) ══════════════════════════════════════════
    'conjunctivitis' => [
        'label' => 'Conjunctivitis',
        'code' => 'H10.9',
        'aliases' => [
            'conjunctivitis', 'sore eyes', 'eye infection', 'red eye', 'pink eye',
        ],
    ],
    'myopia' => [
        'label' => 'Myopia (nearsightedness)',
        'code' => 'H52.1',
        'aliases' => ['myopia', 'nearsightedness', 'short sightedness'],
    ],
    'otitis-media' => [
        'label' => 'Otitis media (ear infection)',
        'code' => 'H66.9',
        'codes' => ['H66.9', 'H65.90'],
        'aliases' => [
            'otitis media', 'ear infection', 'middle ear infection', 'acute otitis media',
        ],
    ],
    'otalgia' => [
        'label' => 'Otalgia (earache)',
        'code' => 'H92.09',
        'aliases' => ['otalgia', 'ear pain', 'earache', 'ear ache'],
    ],

    // ══ Circulatory system (I00-I99) ══════════════════════════════════
    'hypertension' => [
        'label' => 'Hypertension',
        'code' => 'I10',
        'aliases' => [
            'hypertension', 'htn', 'high blood pressure', 'elevated blood pressure',
            'essential hypertension', 'primary hypertension',
        ],
    ],

    // ══ Respiratory system (J00-J99) ══════════════════════════════════
    'upper-respiratory-infection' => [
        'label' => 'Upper respiratory tract infection',
        'code' => 'J06.9',
        'codes' => ['J06.9', 'J00'],
        'aliases' => [
            'uri', 'urti', 'upper respiratory infection', 'upper respiratory tract infection',
            'acute upper respiratory infection', 'acute upper respiratory tract infection',
            'upper respiratory tract infection unspecified', 'common cold', 'cold', 'colds',
            'acute nasopharyngitis', 'nasopharyngitis', 'coryza',
        ],
    ],
    'sinusitis' => [
        'label' => 'Sinusitis',
        'code' => 'J01.9',
        'codes' => ['J01.9', 'J32.9'],
        'aliases' => ['sinusitis', 'acute sinusitis', 'chronic sinusitis', 'sinus infection'],
    ],
    'pharyngitis' => [
        'label' => 'Pharyngitis (sore throat)',
        'code' => 'J02.9',
        'codes' => ['J02.9', 'J02.0'],
        'aliases' => [
            'pharyngitis', 'acute pharyngitis', 'sore throat', 'throat infection',
            'streptococcal pharyngitis', 'strep throat',
        ],
    ],
    'tonsillitis' => [
        'label' => 'Tonsillitis',
        'code' => 'J03.9',
        'codes' => ['J03.9', 'J03.0', 'J35.01'],
        'aliases' => [
            'tonsillitis', 'acute tonsillitis', 'chronic tonsillitis',
            'streptococcal tonsillitis', 'inflamed tonsils',
        ],
    ],
    'laryngitis' => [
        'label' => 'Laryngitis',
        'code' => 'J04.0',
        'codes' => ['J04.0', 'J05.0'],
        'aliases' => ['laryngitis', 'acute laryngitis', 'croup', 'acute obstructive laryngitis'],
    ],
    'pneumonia' => [
        'label' => 'Pneumonia',
        'code' => 'J18.9',
        'codes' => ['J18.9', 'J18.0'],
        'aliases' => [
            'pneumonia', 'bronchopneumonia', 'community acquired pneumonia', 'cap',
        ],
    ],
    'bronchitis' => [
        'label' => 'Acute bronchitis',
        'code' => 'J20.9',
        'aliases' => ['bronchitis', 'acute bronchitis', 'chest cold'],
    ],
    'allergic-rhinitis' => [
        'label' => 'Allergic rhinitis',
        'code' => 'J30.1',
        'codes' => ['J30.1', 'J31.0'],
        'aliases' => [
            'allergic rhinitis', 'rhinitis', 'chronic rhinitis', 'hay fever', 'nasal allergy',
        ],
    ],
    'asthma' => [
        'label' => 'Asthma',
        'code' => 'J45.909',
        'aliases' => ['asthma', 'bronchial asthma', 'acute asthma', 'asthma attack'],
    ],

    // ══ Digestive system (K00-K93) ════════════════════════════════════
    'dental-caries' => [
        'label' => 'Dental caries',
        'code' => 'K02.9',
        'aliases' => ['dental caries', 'tooth decay', 'cavity', 'cavities', 'caries'],
    ],
    'pulpitis' => [
        'label' => 'Pulpitis (toothache)',
        'code' => 'K04.0',
        'aliases' => ['pulpitis', 'toothache', 'tooth pain', 'dental pain'],
    ],
    'oral-aphthae' => [
        'label' => 'Oral aphthae (mouth ulcers)',
        'code' => 'K12.0',
        'aliases' => [
            'oral aphthae', 'mouth ulcer', 'mouth ulcers', 'canker sore', 'canker sores',
            'aphthous ulcer',
        ],
    ],
    'gerd' => [
        'label' => 'Gastro-oesophageal reflux disease',
        'code' => 'K21.9',
        'aliases' => [
            'gerd', 'acid reflux', 'reflux', 'gastroesophageal reflux',
            'gastro oesophageal reflux', 'heartburn',
        ],
    ],
    'gastritis' => [
        'label' => 'Gastritis',
        'code' => 'K29.70',
        'aliases' => ['gastritis', 'acute gastritis', 'chronic gastritis', 'stomach inflammation'],
    ],
    'dyspepsia' => [
        'label' => 'Dyspepsia (indigestion)',
        'code' => 'K30',
        'aliases' => ['dyspepsia', 'indigestion', 'functional dyspepsia', 'upset stomach'],
    ],
    'constipation' => [
        'label' => 'Constipation',
        'code' => 'K59.00',
        'aliases' => ['constipation', 'hard stools'],
    ],
    'appendicitis' => [
        'label' => 'Appendicitis',
        'code' => 'K35.80',
        'aliases' => ['appendicitis', 'acute appendicitis'],
    ],

    // ══ Skin and subcutaneous tissue (L00-L99) ════════════════════════
    'impetigo' => [
        'label' => 'Impetigo',
        'code' => 'L01.0',
        'aliases' => ['impetigo', 'bacterial skin infection'],
    ],
    'abscess' => [
        'label' => 'Cutaneous abscess',
        'code' => 'L02.91',
        'aliases' => ['abscess', 'skin abscess', 'cutaneous abscess', 'boil', 'furuncle'],
    ],
    'cellulitis' => [
        'label' => 'Cellulitis',
        'code' => 'L03.90',
        'aliases' => ['cellulitis'],
    ],
    'dermatitis' => [
        'label' => 'Dermatitis / eczema',
        'code' => 'L30.9',
        'codes' => ['L30.9', 'L20.9', 'L23.9'],
        'aliases' => [
            'dermatitis', 'eczema', 'atopic dermatitis', 'contact dermatitis',
            'allergic dermatitis', 'skin allergy',
        ],
    ],
    'seborrheic-dermatitis' => [
        'label' => 'Seborrheic dermatitis',
        'code' => 'L21.9',
        'aliases' => ['seborrheic dermatitis', 'seborrhoeic dermatitis', 'dandruff'],
    ],
    'urticaria' => [
        'label' => 'Urticaria (hives)',
        'code' => 'L50.9',
        'aliases' => ['urticaria', 'hives', 'welts'],
    ],
    'ingrowing-nail' => [
        'label' => 'Ingrowing nail',
        'code' => 'L60.0',
        'aliases' => ['ingrowing nail', 'ingrown nail', 'ingrown toenail'],
    ],
    'acne' => [
        'label' => 'Acne vulgaris',
        'code' => 'L70.0',
        'aliases' => ['acne', 'acne vulgaris', 'pimples', 'pimple'],
    ],

    // ══ Musculoskeletal system (M00-M99) ══════════════════════════════
    'low-back-pain' => [
        'label' => 'Low back pain',
        'code' => 'M54.5',
        'aliases' => ['low back pain', 'lower back pain', 'back pain', 'lumbago'],
    ],
    'neck-pain' => [
        'label' => 'Neck pain',
        'code' => 'M54.2',
        'aliases' => ['neck pain', 'cervicalgia', 'stiff neck'],
    ],
    'joint-pain' => [
        'label' => 'Joint pain',
        'code' => 'M25.50',
        'aliases' => ['joint pain', 'arthralgia', 'painful joint'],
    ],
    'myalgia' => [
        'label' => 'Myalgia (muscle pain)',
        'code' => 'M79.1',
        'aliases' => [
            'myalgia', 'muscle pain', 'muscle ache', 'body ache', 'body pain', 'muscle cramps',
        ],
    ],
    'rotator-cuff-injury' => [
        'label' => 'Rotator cuff injury',
        'code' => 'M75.100',
        'aliases' => ['rotator cuff tear', 'rotator cuff injury', 'rotator cuff syndrome'],
    ],

    // ══ Genitourinary system (N00-N99) ════════════════════════════════
    'urinary-tract-infection' => [
        'label' => 'Urinary tract infection',
        'code' => 'N39.0',
        'codes' => ['N39.0', 'N30.00'],
        'aliases' => [
            'uti', 'urinary tract infection', 'cystitis', 'bladder infection', 'acute cystitis',
        ],
    ],
    'vaginitis' => [
        'label' => 'Vaginitis',
        'code' => 'N76.0',
        'aliases' => ['vaginitis', 'acute vaginitis', 'vaginal infection'],
    ],
    'dysmenorrhoea' => [
        'label' => 'Dysmenorrhoea',
        'code' => 'N94.6',
        'aliases' => ['dysmenorrhea', 'dysmenorrhoea', 'menstrual cramps', 'period pain'],
    ],

    // ══ Symptoms and signs (R00-R99) ══════════════════════════════════
    'fever' => [
        'label' => 'Fever',
        'code' => 'R50.9',
        'aliases' => ['fever', 'high fever', 'pyrexia', 'febrile'],
    ],
    'cough' => [
        'label' => 'Cough',
        'code' => 'R05',
        'aliases' => ['cough', 'dry cough', 'productive cough', 'persistent cough', 'chronic cough'],
    ],
    'headache' => [
        'label' => 'Headache',
        'code' => 'R51',
        'codes' => ['R51', 'G44.2'],
        'aliases' => [
            'headache', 'head pain', 'tension headache', 'tension type headache',
        ],
    ],
    'abdominal-pain' => [
        'label' => 'Abdominal pain',
        'code' => 'R10.9',
        'aliases' => [
            'abdominal pain', 'stomach ache', 'stomachache', 'tummy ache', 'abdominal cramps',
        ],
    ],
    'chest-pain' => [
        'label' => 'Chest pain',
        'code' => 'R07.9',
        'aliases' => ['chest pain', 'chest discomfort'],
    ],
    'nausea-vomiting' => [
        'label' => 'Nausea and vomiting',
        'code' => 'R11.2',
        'aliases' => [
            'nausea', 'vomiting', 'nausea and vomiting', 'nausea with vomiting',
            'vomiting and nausea',
        ],
    ],
    'fatigue' => [
        'label' => 'Fatigue',
        'code' => 'R53.83',
        'aliases' => ['fatigue', 'tiredness', 'generalized fatigue', 'lethargy'],
    ],
    'rash' => [
        'label' => 'Rash',
        'code' => 'R21',
        'aliases' => ['rash', 'skin rash', 'nonspecific rash', 'skin eruption'],
    ],
    'dyspnoea' => [
        'label' => 'Shortness of breath',
        'code' => 'R06.00',
        'aliases' => ['dyspnea', 'dyspnoea', 'shortness of breath', 'breathlessness', 'difficulty breathing'],
    ],
    'vertigo' => [
        'label' => 'Dizziness / vertigo',
        'code' => 'R42',
        'codes' => ['R42', 'H81.10'],
        'aliases' => [
            'vertigo', 'dizziness', 'dizziness and giddiness', 'light headedness',
            'lightheadedness', 'benign paroxysmal vertigo',
        ],
    ],

    // ══ Injury and allergy (S00-T98) ══════════════════════════════════
    'scalp-contusion' => [
        'label' => 'Scalp contusion',
        'code' => 'S00.03XA',
        'aliases' => ['scalp contusion', 'head contusion', 'head bump'],
    ],
    'radius-fracture' => [
        'label' => 'Radius fracture',
        'code' => 'S52.501A',
        'aliases' => ['radius fracture', 'wrist fracture', 'fracture of radius', 'arm fracture'],
    ],
    'ankle-sprain' => [
        'label' => 'Ankle sprain',
        'code' => 'S93.401A',
        'aliases' => ['ankle sprain', 'sprained ankle', 'ankle injury'],
    ],
    'concussion' => [
        'label' => 'Concussion',
        'code' => 'S06.0X0A',
        'aliases' => ['concussion', 'head concussion'],
    ],
    'burn' => [
        'label' => 'Burn',
        'code' => 'T30.0',
        'aliases' => ['burn', 'burns', 'scald'],
    ],
    'unspecified-injury' => [
        'label' => 'Unspecified injury',
        'code' => 'T14.90XA',
        'aliases' => ['injury', 'trauma', 'unspecified injury'],
    ],
    'allergy' => [
        'label' => 'Allergy / allergic reaction',
        'code' => 'T78.40XA',
        'aliases' => ['allergy', 'allergic reaction', 'unspecified allergy'],
    ],

    // ══ Health services (Z00-Z99) ═════════════════════════════════════
    'general-exam' => [
        'label' => 'General medical examination',
        'code' => 'Z00.00',
        'aliases' => [
            'medical examination', 'annual physical exam', 'physical exam', 'general check up',
            'general checkup', 'medical checkup', 'routine checkup', 'medical check up',
        ],
    ],
    'medical-certificate' => [
        'label' => 'Medical certificate',
        'code' => 'Z02.79',
        'aliases' => ['medical certificate', 'fit to work', 'medical clearance'],
    ],
    'immunization' => [
        'label' => 'Immunization',
        'code' => 'Z23',
        'aliases' => ['immunization', 'vaccination', 'vaccine', 'booster shot'],
    ],
    'family-planning' => [
        'label' => 'Family planning',
        'code' => 'Z30.9',
        'aliases' => ['family planning', 'contraception', 'birth control'],
    ],
    'counselling' => [
        'label' => 'Counselling',
        'code' => 'Z71.9',
        'aliases' => ['counseling', 'counselling', 'counselling session'],
    ],
    'screening' => [
        'label' => 'Health screening',
        'code' => 'Z13.9',
        'aliases' => ['screening', 'health screening'],
    ],
];
