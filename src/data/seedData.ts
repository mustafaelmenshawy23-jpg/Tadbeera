export interface IngredientAlternative {
  name: string;
  impact: string; // Arabic explanation of culinary impact (taste, texture, cooking time)
}

export interface Ingredient {
  name: string;
  quantity: string;
  baseAmount: number;
  unit: string;
  alternatives?: IngredientAlternative[];
}

export interface Recipe {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  prepTimeMinutes: number;
  baseServings: number;
  ingredients: Ingredient[];
  steps: string[];
  budgetCategory: string;
  estimatedCostEgp: number;
  isVeryBudget: boolean;
  isQuick: boolean;
  usesLeftovers: boolean;
  tags: string[];
  imageUrl: string;
  svgFallbackIcon: 'egg' | 'koshary' | 'pasta' | 'soup' | 'meat' | 'salad' | 'potatoes' | 'foul';
}

export interface DailyIdea {
  id: string;
  title: string;
  category: 'طعام' | 'توفير' | 'تنظيف' | 'تنظيم البيت';
  description: string;
  practicalTip: string;
  timeRequired: string;
  tags: string[];
  imageUrl: string;
  svgIcon: 'food' | 'wallet' | 'sparkle' | 'home';
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  impactTag: string;
}

export interface BudgetCategoryDef {
  id: string;
  name: string;
  defaultPct: number;
  tip: string;
  iconName: string;
  isCustom?: boolean;
}

export interface ExpenseRecord {
  id: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
}

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategoryDef[] = [
  {
    id: 'food',
    name: 'طعام وتموين',
    defaultPct: 40,
    tip: 'سوق الخضار الأسبوعي، أساسيات البقالة، واللحوم/البروتين.',
    iconName: 'utensils'
  },
  {
    id: 'bills',
    name: 'فواتير والتزامات',
    defaultPct: 20,
    tip: 'كهرباء، غاز، مياه، اشتراك نت، وباقات الموبايل.',
    iconName: 'receipt'
  },
  {
    id: 'transport',
    name: 'مواصلات وبنزين',
    defaultPct: 15,
    tip: 'مترو، ميكروباص، بنزين أو مواصلات شغل ومدرسة يومية.',
    iconName: 'car'
  },
  {
    id: 'household',
    name: 'مستلزمات البيت',
    defaultPct: 15,
    tip: 'منظفات، صيانة خفيفة، أدوات وأدوية صيدلية البيت.',
    iconName: 'home'
  },
  {
    id: 'savings',
    name: 'ادخار وطوارئ',
    defaultPct: 10,
    tip: 'مبلغ طوارئ في جنب يمنع الاستدانة في الظروف المفاجئة.',
    iconName: 'piggy'
  }
];

export const BUDGET_PRESETS = [
  {
    name: 'نموذج متوازن شهري',
    description: 'توزيع قياسي مناسب لمعظم الأسر المصرية.',
    percentages: [40, 20, 15, 15, 10]
  },
  {
    name: 'نموذج توفير مكثف',
    description: 'رفع نسبة الادخار مع ترشيد النثريات.',
    percentages: [35, 20, 15, 10, 20]
  },
  {
    name: 'نموذج مواسم ومدارس',
    description: 'تركيز على مستلزمات البيت ومصاريف الأولاد.',
    percentages: [30, 20, 10, 30, 10]
  },
  {
    name: 'نموذج ترشيد الفواتير',
    description: 'مخصص لأوقات ذروة الفواتير والصيف.',
    percentages: [40, 25, 15, 10, 10]
  }
];

export const COMMON_INGREDIENTS = [
  'بيض',
  'طماطم',
  'بصل',
  'بطاطس',
  'أرز',
  'مكرونة',
  'عدس أصفر',
  'عدس بجبة',
  'فول',
  'جبنة',
  'تونة',
  'بواقي فراخ',
  'بواقي لحمة',
  'باذنجان',
  'فلفل رومي',
  'ثوم'
];

// Each bundled recipe uses its own dish-matched image URL (31 distinct recipe photos).
export const RECIPES: Recipe[] = [
  {
    id: 'rec_shakshouka',
    name: 'شكشوكة مصرية بالصلصة والبيض',
    mealType: 'breakfast',
    prepTimeMinutes: 15,
    baseServings: 4,
    ingredients: [
      {
        name: 'بيض',
        quantity: '4 بيضات',
        baseAmount: 4,
        unit: 'بيضة',
        alternatives: [
          { name: 'حمص مسلوق ومهروس', impact: 'بديل نباتي غني بالبروتين يمتص نكهة الصلصة بشكل ممتاز.' },
          { name: 'جبنة قريش متبلة', impact: 'تعطي قوام كريمي رائع مع الصلصة وخفيفة جداً.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '4 حبات مفرومة',
        baseAmount: 4,
        unit: 'حبة',
        alternatives: [
          { name: 'صلصة طماطم مع نصف كوب ماء', impact: 'بديل سريع لو الطماطم الطازجة مش متوفرة أو سعرها مرتفع.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '1 بصلة مفرومة',
        baseAmount: 1,
        unit: 'حبة',
        alternatives: [
          { name: 'بصل أخضر مفروم أو ملعقة بصل بودرة', impact: 'يعطي نكهة سريعة بدون تشويح طويل.' }
        ]
      },
      {
        name: 'فلفل رومي',
        quantity: '2 حبة مقطعة',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'فلفل حار أو شطة ناشفة', impact: 'يمنح الشكشوكة لسعة حرارة مصرية مميزة.' }
        ]
      }
    ],
    steps: [
      'في طاسة، شوحي البصل المفروم في ملعقة سمنة أو زيت حتى يذبل ويصبح ذهبي اللون.',
      'أضيفي الفلفل والطماطم المفرومة مع رشة ملح وفلفل أسود وكمون، واتركيها تتسبك لمدة 5 دقائق.',
      'اعملي فتحات صغيرة في الصلصة واكسري البيض فيها بدون خفق.',
      'غطي الطاسة على نار هادئة حتى ينضج البيض تماماً، وقدميها مع عيش بلدي سخن وجرجير.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 38,
    isVeryBudget: true,
    isQuick: true,
    usesLeftovers: false,
    tags: ['فطار', 'عشاء', 'سريع', 'اقتصادي'],
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/EgFoodShakshuka.jpg?width=800',
    svgFallbackIcon: 'egg'
  },
  {
    id: 'rec_koshary_one_pot',
    name: 'كشري الحلة الواحدة السريع بالبصل المقرمش',
    mealType: 'lunch',
    prepTimeMinutes: 30,
    baseServings: 4,
    ingredients: [
      {
        name: 'أرز',
        quantity: '1.5 كوب',
        baseAmount: 1.5,
        unit: 'كوب',
        alternatives: [
          { name: 'شعرية إضافية أو برغل خشن', impact: 'يزيد الشبع ويمنح الكشري قوام محبب سريع النضج.' }
        ]
      },
      {
        name: 'مكرونة',
        quantity: '1.5 كوب مكرونة صغيرة',
        baseAmount: 1.5,
        unit: 'كوب',
        alternatives: [
          { name: 'أي مكرونة مقصوصة أو سباجيتي مكسرة', impact: 'لا فرق في الطعم، استغل كواسر المكرونة الموجودة بالدولاب.' }
        ]
      },
      {
        name: 'عدس بجبة',
        quantity: '1 كوب منقوع',
        baseAmount: 1,
        unit: 'كوب',
        alternatives: [
          { name: 'عدس أصفر أو لوبيا مسلوقة', impact: 'بديل بروتيني سريع يمتزج جيداً مع الأرز.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '2 بصلة شرائح للورد',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'بصل مفروم ناعم', impact: 'يمكن تقليبه مع الحلة مباشرة لتوفير وقت تحمير الورد.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '3 حبات مفرومة للصلصة',
        baseAmount: 3,
        unit: 'حبة',
        alternatives: [
          { name: 'ملعقتين صلصة مع فصين ثوم وخل', impact: 'صلصة كشري سريعة مركزة في 3 دقائق فقط.' }
        ]
      }
    ],
    steps: [
      'حمري شرائح البصل في زيت غزير حتى تقرمش وتصبح ذهبية، وصفيها واحتفظي بزيت التحمير.',
      'في نفس الحلة مع ملعقتين من زيت البصل، شوحي المكرونة حتى تصبح ذهبية، ثم أضيفي الأرز والعدس المنقوع.',
      'أضيفي ماء مغلي يغطي الخليط، مع ملح وكمون ورشة كزبرة، وغطي الحلة على نار هادئة 20 دقيقة.',
      'في طاسة صغيرة جهزي صلصة الطماطم مع الثوم والخل والشطة، وقدمي الكشري مع الورد المقرمش.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 45,
    isVeryBudget: true,
    isQuick: false,
    usesLeftovers: false,
    tags: ['غداء مصري', 'شعبي', 'عائلي', 'توفير'],
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Koshary.jpg?width=800',
    svgFallbackIcon: 'koshary'
  },
  {
    id: 'rec_leftover_chicken_pasta',
    name: 'صينية مكرونة ببواقي الفراخ والصوص الأبيض',
    mealType: 'lunch',
    prepTimeMinutes: 25,
    baseServings: 4,
    ingredients: [
      {
        name: 'بواقي فراخ',
        quantity: '1.5 كوب مفصص',
        baseAmount: 1.5,
        unit: 'كوب',
        alternatives: [
          { name: 'مشروم مشوح أو تونة مصفاة', impact: 'نكهة غنية جداً بالبروتين وبديل فوري واقتصادي.' },
          { name: 'كبد وقوانص مشوحة', impact: 'أرخص سعراً وتعطي صوص داكن غني بالنكهة.' }
        ]
      },
      {
        name: 'مكرونة',
        quantity: '400 جرام مسلوقة',
        baseAmount: 400,
        unit: 'جرام',
        alternatives: [
          { name: 'مكرونة قلم أو لسان عصفور محمر', impact: 'قوام ممتاز يحمل الصوص بالتساوي.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '1 بصلة مفرومة',
        baseAmount: 1,
        unit: 'حبة',
        alternatives: [
          { name: 'فصين ثوم مفرومين', impact: 'نكهة أسرع وأخف للصوص الأبيض.' }
        ]
      },
      {
        name: 'جبنة',
        quantity: 'نصف كوب مبشور',
        baseAmount: 0.5,
        unit: 'كوب',
        alternatives: [
          { name: 'ملعقة بقسماط مع رشة سمنة على الوجه', impact: 'يعطي وجه مقرمش ذهبي محمر بدون الحاجة لشراء جبنة باهظة.' }
        ]
      }
    ],
    steps: [
      'في طاسة، شوحي البصل مع رشة فلفل وبهارات فراخ، ثم أضيفي بواقي الفراخ المقطعة وقلبي دقيقتين.',
      'جهزي صوص أبيض خفيف (ملعقة دقيق + ملعقة سمنة + كوبين حليب أو ماء سلق المكرونة مع مكعب مرقة).',
      'اخلطي المكرونة المسلوقة مع الفراخ والصوص، واسكبي الخليط في صينية فرن.',
      'أدخليها تحت شواية الفرن 7 دقائق حتى تأخذ لوناً ذهبياً وشهياً.'
    ],
    budgetCategory: 'استغلال بواقي الأكل',
    estimatedCostEgp: 50,
    isVeryBudget: false,
    isQuick: false,
    usesLeftovers: true,
    tags: ['غداء', 'تدوير بواقي الأكل', 'سريع', 'أطفال'],
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281721?auto=format&fit=crop&w=600&q=80',
    svgFallbackIcon: 'pasta'
  },
  {
    id: 'rec_lentil_soup',
    name: 'شوربة عدس أصفر دافية مع عيش بلدي محمص',
    mealType: 'dinner',
    prepTimeMinutes: 20,
    baseServings: 4,
    ingredients: [
      {
        name: 'عدس أصفر',
        quantity: '1.5 كوب مغسول',
        baseAmount: 1.5,
        unit: 'كوب',
        alternatives: [
          { name: 'نصف كوب شعرية محمرة مع العدس', impact: 'يزيد كثافة الشوربة ويجعلها وجبة عشاء مشبعة جداً.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '1 بصلة متوسطة',
        baseAmount: 1,
        unit: 'حبة',
        alternatives: [
          { name: 'بصلة محمرة طشة على الوجه', impact: 'يعطي نكهة تقلية كلاسيكية دافية لا تقاوم.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '2 حبة طماطم',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'ملعقة صغيرة بابريكا مع كركم', impact: 'يمنح الشوربة اللون البرتقالي الذهبي المميز.' }
        ]
      },
      {
        name: 'بطاطس',
        quantity: '1 حبة صغيرة مقطعة',
        baseAmount: 1,
        unit: 'حبة',
        alternatives: [
          { name: 'جزرة مقطعة أو كوسة', impact: 'تضيف قوام كريمي ونعومة وقيمة غذائية عالية بدون نشويات إضافية.' }
        ]
      }
    ],
    steps: [
      'في حلة، ضعي العدس المغسول مع البصل والطماطم والبطاطس، وغطيها بالماء المغلي واتركيها 15 دقيقة.',
      'اخلطي المكونات بالخلاط أو الهاند بلندر حتى تصبح ناعمة كالحرير.',
      'أعيديها على النار مع ملعقة سمنة أو زيت، رشة كمون، ملح، وكزبرة جافة.',
      'حمّصي عيش بلدي في الفرن وقدميه مع الشوربة الساخنة وعصرة ليمونة طازجة.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 32,
    isVeryBudget: true,
    isQuick: true,
    usesLeftovers: false,
    tags: ['عشاء', 'شوربة', 'شتاء', 'صحي', 'بروتين نباتي'],
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/EgFoodLentilSoup.jpg?width=800',
    svgFallbackIcon: 'soup'
  },
  {
    id: 'rec_leftover_meat_fatta',
    name: 'فتة أرز سريعة ببواقي اللحمة المسلوقة والخل والثوم',
    mealType: 'lunch',
    prepTimeMinutes: 20,
    baseServings: 4,
    ingredients: [
      {
        name: 'بواقي لحمة',
        quantity: '1.5 كوب لحمة مقطعة',
        baseAmount: 1.5,
        unit: 'كوب',
        alternatives: [
          { name: 'كبدة مشوحة أو قطع باذنجان رومي مقلي', impact: 'فتة باذنجان صيامي أو بالخل والثوم موفرة ولذيذة جداً.' }
        ]
      },
      {
        name: 'أرز',
        quantity: '2 كوب أرز أبيض مطبوخ',
        baseAmount: 2,
        unit: 'كوب',
        alternatives: [
          { name: 'بواقي أرز بشعرية من اليوم السابق', impact: 'تسخين سريع وتوفير وقت الطبخ بالكامل.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '3 حبات للصلصة',
        baseAmount: 3,
        unit: 'حبة',
        alternatives: [
          { name: 'ملعقة صلصة مذابة في كوب مرقة', impact: 'صلصة فتة فورية جاهزة في دقيقة واحدة.' }
        ]
      },
      {
        name: 'ثوم',
        quantity: '4 فصوص مهروسة',
        baseAmount: 4,
        unit: 'فص',
        alternatives: [
          { name: 'نصف ملعقة صغيرة ثوم بودرة', impact: 'بديل سريع لو الثوم الطازج غير متوفر.' }
        ]
      }
    ],
    steps: [
      'حمّصي قطع العيش في ملعقة سمنة أو بالفرن وضعيه في قاع الطبق مع كبشة مرقة خفيفة ودقة ثوم.',
      'في طاسة، شوحي قطع اللحمة مع فص ثوم ورشة فلفل أسود ومستكة حتى تتحمر وتكتسب نكهة طازجة.',
      'ضعي طبقة الأرز الأبيض فوق العيش المحمص، ثم أضيفي قطع اللحمة المشوحة.',
      'صبي دقة الثوم والخل وصلصة الطماطم الساخنة على الوجه وقدميها مباشرة.'
    ],
    budgetCategory: 'استغلال بواقي الأكل',
    estimatedCostEgp: 42,
    isVeryBudget: false,
    isQuick: true,
    usesLeftovers: true,
    tags: ['غداء', 'أكلات مصرية', 'استغلال بواقي'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    svgFallbackIcon: 'meat'
  },
  {
    id: 'rec_foul_salad',
    name: 'طبق فول مدمس بالسلطة والطحينة والزيت الحار',
    mealType: 'breakfast',
    prepTimeMinutes: 10,
    baseServings: 4,
    ingredients: [
      {
        name: 'فول',
        quantity: '2 كوب فول مدمس',
        baseAmount: 2,
        unit: 'كوب',
        alternatives: [
          { name: 'حمص مسلوق مدمس', impact: 'يعطي نكهة مسبكة شبيهة بفول الحمص الشامي الغني بالألياف.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '2 حبة مكعبات صغيرة',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'ملعقة بقدونس مفروم مع ليمون', impact: 'طعم منعش وأخف على المعدة في الصباح.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '1 بصلة صغيرة مفرومة',
        baseAmount: 1,
        unit: 'حبة',
        alternatives: [
          { name: 'بصل أخضر شرائح', impact: 'أهدأ في الحدة ومثالي للفطار في بداية اليوم.' }
        ]
      },
      {
        name: 'بيض',
        quantity: '2 بيضة مسلوقة للوجه',
        baseAmount: 2,
        unit: 'بيضة',
        alternatives: [
          { name: 'مكعبات جبنة بيضاء أو فلافل', impact: 'بدائل شعبية ممتازة لرفع القيمة الغذائية.' }
        ]
      }
    ],
    steps: [
      'سخني الفول واهرسيه قليلاً بالشوكة مع رشة ملح وكمون وشطة وعصرة ليمونة كاملة.',
      'أضيفي مكعبات الطماطم والبصل ورشة زيت حار أو زيت ذرة وملعقة طحينة بيضاء.',
      'قلبي المكونات جيداً وزيني الطبق بشرائح البيض المسلوق ورشة كمون.',
      'يقدم ساخناً مع عيش بلدي مقرمش ومخلل ليمون معصفر.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 26,
    isVeryBudget: true,
    isQuick: true,
    usesLeftovers: false,
    tags: ['فطار', 'عشاء', 'بروتين', 'سريع جداً'],
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ful_medames.jpg?width=800',
    svgFallbackIcon: 'foul'
  },
  {
    id: 'rec_tuna_potato_salad',
    name: 'سلطة تونة بالبطاطس المهروسة والبصل والليمون',
    mealType: 'dinner',
    prepTimeMinutes: 15,
    baseServings: 4,
    ingredients: [
      {
        name: 'تونة',
        quantity: '1 علبة تونة مصفاة',
        baseAmount: 1,
        unit: 'علبة',
        alternatives: [
          { name: 'بيض مسلوق مهروس', impact: 'سلطة بيض وبطاطس بيوريه توفر ثمن التونة تماماً.' },
          { name: 'سردين معلب مصفى', impact: 'بديل أرخص وغني بأوميجا 3 وكالسيوم طبيعي.' }
        ]
      },
      {
        name: 'بطاطس',
        quantity: '3 حبات مسلوقة ومهروسة',
        baseAmount: 3,
        unit: 'حبة',
        alternatives: [
          { name: 'حمص مسلوق مفروم خشن', impact: 'قوام متماسك ومذاق شرق أوسطي رائع.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '1 بصلة صغيرة مفرومة',
        baseAmount: 1,
        unit: 'حبة',
        alternatives: [
          { name: 'بصل مخلل أو شبت مفروم', impact: 'يقطع زفارة التونة ويعطي قرمشة منعشة.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '2 حبة مكعبات',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'خيار مخلل مقطع قطع صغيرة', impact: 'يوازن حموضة الطبق ونكهته.' }
        ]
      }
    ],
    steps: [
      'في وعاء، اهرسي البطاطس المسلوقة مع ملعقة زيت ذرة ورشة ملح وكمون وفلفل أسود.',
      'أضيفي التونة المصفاة، البصل المفروم، ومكعبات الطماطم وعصرة ليمونة كبيرة.',
      'امزجي المكونات بلطف بالشوكة حتى تتجانس بدون أن تصبح عجينة ثقيلة.',
      'تؤكل باردة بالعيش البلدي أو شرائح الخيار كوجبة عشاء خفيفة ومغذية.'
    ],
    budgetCategory: 'متوسط',
    estimatedCostEgp: 58,
    isVeryBudget: false,
    isQuick: true,
    usesLeftovers: false,
    tags: ['عشاء', 'بروتين', 'سهل', 'سلطات'],
    imageUrl: 'https://kep.cdn.indexvas.hu/1/0/5737/57377/573775/57377541_6f567550428b63978c384deb58d477f9_wm.jpg',
    svgFallbackIcon: 'salad'
  },
  {
    id: 'rec_fried_pasta',
    name: 'مكرونة محمرة بالصلصة والمرقة على الطريقة المصرية',
    mealType: 'dinner',
    prepTimeMinutes: 18,
    baseServings: 4,
    ingredients: [
      {
        name: 'مكرونة',
        quantity: '350 جرام مقصوصة',
        baseAmount: 350,
        unit: 'جرام',
        alternatives: [
          { name: 'لسان عصفور أو شعرية', impact: 'طريقة التحمير واحدة ونتيجتها خفيفة جداً ومحبوبة للأطفال.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '3 حبات عصير أو ملعقتين صلصة',
        baseAmount: 3,
        unit: 'حبة',
        alternatives: [
          { name: 'مكعب مرقة خضار مع نصف ملعقة كاري', impact: 'مكرونة محمرة صفراء مبهرة بدون طماطم.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '1 بصلة مفرومة',
        baseAmount: 1,
        unit: 'حبة',
        alternatives: [
          { name: 'فص ثوم مشوح مع المكرونة', impact: 'ريحة قوية وتوفير وقت تقطيع البصل.' }
        ]
      }
    ],
    steps: [
      'في حلة، ضعي ملعقتين زيت وحمري المكرونة مع التقليب المستمر حتى تصبح ذهبية موحدة.',
      'أضيفي عصير الطماطم والملح والفلفل ورشة سكر ومكعب مرقة.',
      'اسكبي ماء مغلي يغطي المكرونة بمقدار عقلة إصبع واحدة.',
      'اتركيها تغلي وتتشرب السائل، ثم هدي النار تماماً وغطي الحلة 10 دقائق حتى تمام النضج.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 24,
    isVeryBudget: true,
    isQuick: true,
    usesLeftovers: false,
    tags: ['عشاء', 'سريع', 'أطفال', 'اقتصادي'],
    imageUrl: 'https://www.supermama.me/system/App/Entities/Recipe/images/000/102/904/watermarked/%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D9%85%D9%83%D8%B1%D9%88%D9%86%D8%A9-%D8%A7%D9%84%D9%85%D8%AD%D9%85%D8%B1%D8%A9-%D8%A8%D8%A7%D9%84%D8%B5%D9%84%D8%B5%D8%A9.jpg',
    svgFallbackIcon: 'pasta'
  },
  {
    id: 'rec_mashed_potato_eggs',
    name: 'بطاطس بيوريه بالكمون والثوم مع البيض المدحرج بالسمنة',
    mealType: 'dinner',
    prepTimeMinutes: 18,
    baseServings: 4,
    ingredients: [
      {
        name: 'بطاطس',
        quantity: '4 حبات مسلوقة ومهروسة',
        baseAmount: 4,
        unit: 'حبة',
        alternatives: [
          { name: 'كوسة مسلوقة مع بطاطس', impact: 'تخفيف النشويات وزيادة الألياف بمذاق هادئ.' }
        ]
      },
      {
        name: 'بيض',
        quantity: '4 بيضات مسلوقة',
        baseAmount: 4,
        unit: 'بيضة',
        alternatives: [
          { name: 'مكعبات جبنة رومي أو فلفل رومي مقلي', impact: 'بديل سريع للتزيين والنكهة الشرقية.' }
        ]
      },
      {
        name: 'ثوم',
        quantity: '2 فص مهروس',
        baseAmount: 2,
        unit: 'فص',
        alternatives: [
          { name: 'ملعقة صغيرة كمون مع ليمون', impact: 'نكهة كمونية نقية بدون حدة الثوم.' }
        ]
      }
    ],
    steps: [
      'اهرسي البطاطس المسلوقة ناعماً مع ملعقة سمنة، رشة كمون، ملح وفص ثوم مفروم ناعم.',
      'في طاسة، دحرجي البيض المسلوق في ملعقة سمنة بلدي صغيرة مع رشة ملح وفلفل حتى يحمر وجهه.',
      'افردي البطاطس في طبق التقديم وضعي فوقها البيض المدحرج ورشة بابريكا وكمون.',
      'قدميها دافية مع عيش بلدي مقرمش وسلطة خضراء.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 34,
    isVeryBudget: true,
    isQuick: true,
    usesLeftovers: false,
    tags: ['عشاء', 'وجبة متكاملة', 'توفير', 'أكلات زمان'],
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    svgFallbackIcon: 'potatoes'
  },
  {
    id: 'rec_baked_eggs_ojja',
    name: 'عجة بيض بالبصل والخضار في طاسة الفرن',
    mealType: 'breakfast',
    prepTimeMinutes: 20,
    baseServings: 4,
    ingredients: [
      {
        name: 'بيض',
        quantity: '4 بيضات',
        baseAmount: 4,
        unit: 'بيضة',
        alternatives: [
          { name: 'ملعقتين حمص مطحون أو دقيق حمص مع بيضتين', impact: 'مضاعفة الحجم وزيادة البروتين بدون شراء كرتونة بيض كاملة.' }
        ]
      },
      {
        name: 'بصل',
        quantity: '2 بصلة مفرومة',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'كراث أو بصل أخضر', impact: 'نكهة أهدأ وسرعة في التسوية.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '2 حبة طماطم مبشورة',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'بقدونس وشبت مفروم', impact: 'عجة خضراء إسكندراني كلاسيكية ذات رائحة مميزة.' }
        ]
      }
    ],
    steps: [
      'شوحي البصل المفروم في طاسة حتى يكتسب لوناً كراميلياً غنياً واتركيه يهدأ.',
      'اخفقي البيض مع رشة ملح، كمون، فلفل أسود، وملعقة دقيق واحدة مع الطماطم المبشورة.',
      'أضيفي البصل بعد أن يبرد قليلاً إلى خليط البيض، وصبي الخليط في صينية مدهونة بزيت.',
      'اخبزيها في الفرن لمدة 15 دقيقة حتى تنتفخ وتتماسك وتكتسب لوناً ذهبياً.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 36,
    isVeryBudget: true,
    isQuick: true,
    usesLeftovers: false,
    tags: ['فطار', 'وجبة شعبية', 'عشاء', 'بروتين اقتصادي'],
    imageUrl: 'https://www.cairo24.com/Upload/libfiles/164/5/122.jpg',
    svgFallbackIcon: 'egg'
  },
  {
    id: 'rec_moussaka_potatoes',
    name: 'مسقعة مصرية بالباذنجان والبطاطس والصلصة الحارة',
    mealType: 'lunch',
    prepTimeMinutes: 30,
    baseServings: 4,
    ingredients: [
      {
        name: 'باذنجان',
        quantity: '2 حبة رومي كبيرة شرائح',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'كوسة شرائح مشوية', impact: 'أخف في الزيت وبديل شهي جداً ومغذي.' }
        ]
      },
      {
        name: 'بطاطس',
        quantity: '2 حبة أصابع محمرة',
        baseAmount: 2,
        unit: 'حبة',
        alternatives: [
          { name: 'جزر شرائح مشوية', impact: 'يعطي توازن حلو مع صلصة المسقعة الحارة.' }
        ]
      },
      {
        name: 'طماطم',
        quantity: '4 حبات مفرومة للصلصة',
        baseAmount: 4,
        unit: 'حبة',
        alternatives: [
          { name: 'صلصة طماطم مع فصين ثوم وخل', impact: 'صلصة مسقعة مسبكة وسريعة بدون تقطيع.' }
        ]
      },
      {
        name: 'فلفل رومي',
        quantity: '3 حبات مقلية',
        baseAmount: 3,
        unit: 'حبة',
        alternatives: [
          { name: 'قرن فلفل حامي مشوح', impact: 'المسقعة المشطشطة الأصلية لمحبي الحار.' }
        ]
      }
    ],
    steps: [
      'رشي ملح على شرائح الباذنجان 10 دقائق ثم نشفيها وحمريها في الزيت أو بالفرن لتوفير الزيت.',
      'حمري أصابع البطاطس وشرائح الفلفل.',
      'في طاسة، شوحي الثوم والخل وأضيفي عصير الطماطم حتى تتسبك مع ملح وكمون.',
      'رصي الباذنجان والبطاطس والفلفل في صينية وصبي الصلصة فوقها وادخليها الفرن 10 دقائق.'
    ],
    budgetCategory: 'اقتصادي جداً',
    estimatedCostEgp: 42,
    isVeryBudget: true,
    isQuick: false,
    usesLeftovers: false,
    tags: ['غداء', 'أكلات مصرية', 'شعبي', 'توفير'],
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Egyptian-Musakaa-Musa3a.jpg?width=800',
    svgFallbackIcon: 'egg'
  }
];


/* Ten additional everyday Egyptian recipes for the in-app recipe library. */
const EXTRA_EGYPTIAN_RECIPES: Recipe[] = [
  { id:'rec_feteer_meshaltet', name:'فطير مشلتت بيتي', mealType:'breakfast', prepTimeMinutes:55, baseServings:4, ingredients:[{name:'دقيق',quantity:'4 أكواب',baseAmount:4,unit:'كوب'},{name:'ماء دافئ',quantity:'1.5 كوب',baseAmount:1.5,unit:'كوب'},{name:'ملح',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'},{name:'سمنة',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'}], steps:['اخلط الدقيق والملح وأضف الماء تدريجياً حتى تتكون عجينة طرية.','اعجن جيداً ثم اترك العجينة ترتاح 30 دقيقة.','قسّمها كرات وافرد كل كرة رقيقاً وادهنها بالسمنة واطوها عدة طبقات.','افرد الفطير برفق واخبزه في فرن ساخن حتى ينتفخ ويحمر.'], budgetCategory:'فطار بيتي', estimatedCostEgp:48, isVeryBudget:true, isQuick:false, usesLeftovers:false, tags:['فطار','مخبوزات','مصري'], imageUrl:'https://www.cairo24.com/Upload/libfiles/130/7/624.jpg', svgFallbackIcon:'pasta' },
  { id:'rec_shabora', name:'شابورة مصرية باليانسون', mealType:'breakfast', prepTimeMinutes:45, baseServings:6, ingredients:[{name:'دقيق',quantity:'3 أكواب',baseAmount:3,unit:'كوب'},{name:'سكر',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'},{name:'زيت',quantity:'ربع كوب',baseAmount:0.25,unit:'كوب'},{name:'يانسون',quantity:'ملعقة كبيرة',baseAmount:1,unit:'ملعقة كبيرة'},{name:'بيكنج بودر',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'}], steps:['اخلط الدقيق والسكر واليانسون والبيكنج بودر.','أضف الزيت والماء تدريجياً واعجن حتى تتماسك العجينة.','شكّلها أصابع أو أرغفة صغيرة وضعها في صينية.','اخبزها حتى تتماسك، ثم قطّعها شرائح وأعدها للفرن حتى تجف وتتحمص.'], budgetCategory:'مخبوزات اقتصادية', estimatedCostEgp:35, isVeryBudget:true, isQuick:false, usesLeftovers:false, tags:['مخبوزات','شابورة','مصري','سناك'], imageUrl:'https://img-global.cpcdn.com/recipes/e1812c7c864898d8/1200x630cq80/photo.jpg', svgFallbackIcon:'pasta' },
  { id:'rec_fayesh', name:'فايش صعيدي بالسمسم', mealType:'breakfast', prepTimeMinutes:60, baseServings:6, ingredients:[{name:'دقيق',quantity:'3 أكواب',baseAmount:3,unit:'كوب'},{name:'لبن',quantity:'كوب',baseAmount:1,unit:'كوب'},{name:'خميرة',quantity:'ملعقة كبيرة',baseAmount:1,unit:'ملعقة كبيرة'},{name:'سمسم',quantity:'ملعقتان كبيرتان',baseAmount:2,unit:'ملعقة كبيرة'},{name:'سكر',quantity:'ملعقة كبيرة',baseAmount:1,unit:'ملعقة كبيرة'}], steps:['ذوّب الخميرة والسكر في اللبن الدافئ واتركها حتى تنشط.','أضف الدقيق والسمسم واعجن حتى تحصل على عجينة متماسكة.','اترك العجينة تختمر ثم شكّلها أصابع طويلة.','اخبزها حتى تنضج، واتركها تبرد ثم قطّعها شرائح وحمّصها في الفرن.'], budgetCategory:'مخبوزات', estimatedCostEgp:42, isVeryBudget:true, isQuick:false, usesLeftovers:false, tags:['فايش','مخبوزات','صعيدي','مصري'], imageUrl:'https://media.gemini.media/img/original/2018/12/2/2018_12_2_17_28_6_592.jpg', svgFallbackIcon:'pasta' },
  { id:'rec_hawawshi', name:'حواوشي بلدي في الفرن', mealType:'lunch', prepTimeMinutes:40, baseServings:4, ingredients:[{name:'لحم مفروم',quantity:'500 جرام',baseAmount:500,unit:'جرام'},{name:'عيش بلدي',quantity:'4 أرغفة',baseAmount:4,unit:'رغيف'},{name:'بصل',quantity:'بصلة كبيرة',baseAmount:1,unit:'حبة'},{name:'فلفل رومي',quantity:'حبتان',baseAmount:2,unit:'حبة'},{name:'بهارات',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'}], steps:['افرُم البصل والفلفل ناعماً واخلطهما مع اللحم والبهارات والملح والفلفل.','افتح الأرغفة واحشها بطبقة متساوية من خليط اللحم.','ادهن الخبز بقليل من الزيت ولفه بورق زبدة أو فويل.','اخبزه في فرن ساخن مع التقليب حتى ينضج اللحم ويتحمص العيش.'], budgetCategory:'وجبة رئيسية', estimatedCostEgp:95, isVeryBudget:false, isQuick:false, usesLeftovers:false, tags:['غداء','لحوم','مصري'], imageUrl:'https://www.shorouknews.com/uploadedimages/Other/original/%D8%AD%D9%88%D8%A7%D9%88432%D8%B4%D9%8A.jpg', svgFallbackIcon:'meat' },
  { id:'rec_kebda_iskandarani', name:'كبدة إسكندراني بالفلفل', mealType:'lunch', prepTimeMinutes:25, baseServings:4, ingredients:[{name:'كبدة',quantity:'500 جرام',baseAmount:500,unit:'جرام'},{name:'فلفل رومي',quantity:'حبتان',baseAmount:2,unit:'حبة'},{name:'ثوم',quantity:'4 فصوص',baseAmount:4,unit:'فص'},{name:'خل',quantity:'ملعقة كبيرة',baseAmount:1,unit:'ملعقة كبيرة'},{name:'كمون',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'}], steps:['قطّع الكبدة شرائح رفيعة وجهّز الثوم والفلفل.','سخّن الزيت وأضف الثوم ثم الكبدة على نار عالية.','أضف الفلفل والكمون والكزبرة والخل وقلّب حتى تنضج الكبدة جيداً.','قدّمها ساخنة مع عيش بلدي وسلطة طحينة.'], budgetCategory:'وجبة رئيسية', estimatedCostEgp:88, isVeryBudget:false, isQuick:true, usesLeftovers:false, tags:['غداء','كبدة','إسكندراني','مصري'], imageUrl:'https://www.tasteatlas.com/images/dishes/f4d8a7febf434305a362fbf8a3936986.jpg', svgFallbackIcon:'meat' },
  { id:'rec_molokhia', name:'ملوخية مصرية بالأرانب أو الفراخ', mealType:'lunch', prepTimeMinutes:35, baseServings:4, ingredients:[{name:'ملوخية مفرومة',quantity:'500 جرام',baseAmount:500,unit:'جرام'},{name:'مرقة',quantity:'4 أكواب',baseAmount:4,unit:'كوب'},{name:'ثوم',quantity:'6 فصوص',baseAmount:6,unit:'فص'},{name:'كزبرة ناشفة',quantity:'ملعقة كبيرة',baseAmount:1,unit:'ملعقة كبيرة'},{name:'سمنة',quantity:'ملعقة كبيرة',baseAmount:1,unit:'ملعقة كبيرة'}], steps:['سخّن المرقة حتى تقترب من الغليان ثم أضف الملوخية وقلّب بهدوء.','لا تترك الملوخية تغلي بقوة؛ اضبط القوام حسب الرغبة.','حمّر الثوم في السمنة وأضف الكزبرة حتى تظهر الرائحة.','أضف التقلية إلى الملوخية وقدّمها مع الأرز والبروتين المطهو.'], budgetCategory:'وجبة بيتية', estimatedCostEgp:52, isVeryBudget:true, isQuick:true, usesLeftovers:false, tags:['غداء','ملوخية','مصري'], imageUrl:'https://e.his-j.com/images/area7/egy/w944/meal/egy_molokheiyasoup_01.jpg', svgFallbackIcon:'soup' },
  { id:'rec_koshari_iskandarani', name:'كشري إسكندراني بالعدس والأرز', mealType:'lunch', prepTimeMinutes:35, baseServings:4, ingredients:[{name:'أرز',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'عدس أصفر',quantity:'كوب',baseAmount:1,unit:'كوب'},{name:'بصل',quantity:'بصلة',baseAmount:1,unit:'حبة'},{name:'كمون',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'},{name:'زيت',quantity:'ملعقتان كبيرتان',baseAmount:2,unit:'ملعقة كبيرة'}], steps:['اغسل الأرز والعدس الأصفر جيداً.','شوّح البصل في الزيت حتى يذبل ثم أضف العدس والأرز والكمون.','أضف الماء الساخن والملح واترك الخليط على نار هادئة حتى ينضج.','قدّمه ساخناً مع السلطة أو البيض حسب الرغبة.'], budgetCategory:'اقتصادي جداً', estimatedCostEgp:38, isVeryBudget:true, isQuick:true, usesLeftovers:false, tags:['غداء','كشري','مصري','اقتصادي'], imageUrl:'https://nutriscan.app/calories-nutrition/images/koshari-d7bac.webp', svgFallbackIcon:'pasta' },
  { id:'rec_renga_salad', name:'سلطة رنجة مصرية بالطحينة', mealType:'dinner', prepTimeMinutes:20, baseServings:4, ingredients:[{name:'رنجة مدخنة',quantity:'سمكتان',baseAmount:2,unit:'سمكة'},{name:'طحينة',quantity:'4 ملاعق كبيرة',baseAmount:4,unit:'ملعقة كبيرة'},{name:'بصل',quantity:'بصلة',baseAmount:1,unit:'حبة'},{name:'طماطم',quantity:'حبتان',baseAmount:2,unit:'حبة'},{name:'ليمون',quantity:'حبتان',baseAmount:2,unit:'حبة'}], steps:['نظّف الرنجة وانزع الجلد والشوك وقطّع اللحم قطعاً صغيرة.','اخلط الطحينة بعصير الليمون والماء حتى يصبح قوامها مناسباً.','أضف البصل والطماطم والرنجة وقلّب المكونات.','قدّم السلطة باردة مع الخبز والخضروات الطازجة.'], budgetCategory:'عشاء', estimatedCostEgp:105, isVeryBudget:false, isQuick:true, usesLeftovers:false, tags:['عشاء','سمك','رنجة','مصري'], imageUrl:'https://images.squarespace-cdn.com/content/v1/56e044ee859fd0fc99420936/1755517643414-YVY3Y2US516CQX1D9LCA/IMG_7983.jpg', svgFallbackIcon:'salad' },
  { id:'rec_basbousa', name:'بسبوسة مصرية بالسمن', mealType:'dinner', prepTimeMinutes:40, baseServings:8, ingredients:[{name:'سميد',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'زبادي',quantity:'كوب',baseAmount:1,unit:'كوب'},{name:'سكر',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'},{name:'سمنة',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'},{name:'بيكنج بودر',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'}], steps:['اخلط السميد والسكر والبيكنج بودر.','أضف السمنة والزبادي وقلّب بخفة حتى يتجانس الخليط.','افرد الخليط في صينية مدهونة وقطّعه مربعات.','اخبزه حتى يصبح ذهبي اللون ثم اسقه بالشربات الدافئ واتركه يبرد.'], budgetCategory:'حلويات', estimatedCostEgp:62, isVeryBudget:false, isQuick:false, usesLeftovers:false, tags:['حلويات','بسبوسة','مصري'], imageUrl:'https://www.youregypttours.com/storage/egyptian-basbousa.jpg', svgFallbackIcon:'pasta' },
  { id:'rec_konafa', name:'كنافة مصرية بالقشطة', mealType:'dinner', prepTimeMinutes:50, baseServings:8, ingredients:[{name:'كنافة',quantity:'500 جرام',baseAmount:500,unit:'جرام'},{name:'سمنة',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'},{name:'لبن',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'نشا',quantity:'ملعقتان كبيرتان',baseAmount:2,unit:'ملعقة كبيرة'},{name:'سكر',quantity:'كوب شربات',baseAmount:1,unit:'كوب'}], steps:['فتّت الكنافة واخلطها بالسمنة المذابة.','حضّر القشطة بتقليب اللبن والنشا على النار حتى يثخن القوام.','ضع نصف الكنافة في الصينية ثم القشطة ثم باقي الكنافة.','اخبزها حتى تحمر واسقها بالشربات حسب الرغبة.'], budgetCategory:'حلويات', estimatedCostEgp:90, isVeryBudget:false, isQuick:false, usesLeftovers:false, tags:['حلويات','كنافة','مصري'], imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/EgyptianKonafaWithCream%20PhotoByWaelNawaraKonafa.jpg?width=1000', svgFallbackIcon:'pasta' }
];

/* Full-detail dishes transcribed and adapted from the user's Egyptian food encyclopedia. */
EXTRA_EGYPTIAN_RECIPES.push(
  { id:'rec_foul_medames_encyclopedia', name:'الفول المدمس المصري', mealType:'breakfast', prepTimeMinutes:420, baseServings:4, ingredients:[{name:'فول تدميس',quantity:'2 كوب منقوع',baseAmount:2,unit:'كوب'},{name:'فول مدشوش',quantity:'ربع كوب',baseAmount:0.25,unit:'كوب'},{name:'عدس أصفر',quantity:'ملعقتان كبيرتان',baseAmount:2,unit:'ملعقة كبيرة'},{name:'ليمون',quantity:'ليمونة',baseAmount:1,unit:'حبة'},{name:'كمون',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'}], steps:['انقع الفول 6 إلى 8 ساعات ثم صفّه.','ضع الفول في الدماسة مع الفول المدشوش والعدس والليمونة واغمره بماء مغلي.','اتركه على أهدأ نار من 6 إلى 8 ساعات، مع إضافة ماء مغلي عند الحاجة فقط.','اهرِس الكمية المطلوبة وتبّلها بالملح والكمون والليمون، وقدّمها بالزيت والطحينة.'], budgetCategory:'اقتصادي جداً',estimatedCostEgp:30,isVeryBudget:true,isQuick:false,usesLeftovers:false,tags:['فطار','فول','مصري','شعبي'],imageUrl:'https://nutriscan.app/calories-nutrition/images/ful-medames-bddcc.webp',svgFallbackIcon:'foul' },
  { id:'rec_taameya_encyclopedia', name:'الطعمية المصرية بالفول المدشوش', mealType:'breakfast', prepTimeMinutes:35, baseServings:4, ingredients:[{name:'فول مدشوش',quantity:'2 كوب منقوع',baseAmount:2,unit:'كوب'},{name:'كرات',quantity:'حزمة صغيرة',baseAmount:1,unit:'حزمة'},{name:'كزبرة خضراء',quantity:'حزمة',baseAmount:1,unit:'حزمة'},{name:'بقدونس',quantity:'نصف حزمة',baseAmount:0.5,unit:'حزمة'},{name:'بصل',quantity:'بصلة',baseAmount:1,unit:'حبة'},{name:'ثوم',quantity:'3 فصوص',baseAmount:3,unit:'فص'}], steps:['صفّي الفول المدشوش المنقوع وافرميه مع الكرات والبقدونس والكزبرة والبصل والثوم.','اخفق العجينة حتى يدخلها الهواء وتصبح ناعمة ومتجانسة.','تبّل بالملح والكمون والكزبرة الجافة وشكّل أقراصاً، ويمكن تغطيتها بالسمسم.','اقْلِ الأقراص في زيت متوسط السخونة حتى تنضج من الداخل وتصبح ذهبية، ثم صفّها.'], budgetCategory:'اقتصادي جداً',estimatedCostEgp:32,isVeryBudget:true,isQuick:true,usesLeftovers:false,tags:['فطار','طعمية','فلافل','مصري'],imageUrl:'https://afrotools.com/assets/img/kitchen/taameya-eg.webp',svgFallbackIcon:'foul' },
  { id:'rec_mahshi_mixed_encyclopedia', name:'المحشي المصري المشكل (كرنب وكوسة وباذنجان وورق عنب)', mealType:'lunch', prepTimeMinutes:100, baseServings:6, ingredients:[{name:'كرنب أو ورق عنب وكوسة وباذنجان',quantity:'حوالي 1.5 كيلو',baseAmount:1.5,unit:'كيلو'},{name:'أرز مصري',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'عصير طماطم',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'بصل',quantity:'بصلة كبيرة',baseAmount:1,unit:'حبة'},{name:'شبت وكزبرة وبقدونس',quantity:'حزمة مشكلة',baseAmount:1,unit:'حزمة'},{name:'نعناع جاف',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'}], steps:['شوّح البصل في الزيت والسمن ثم أضف عصير الطماطم والتوابل واتركها تتسبك.','اخلط الصلصة بعد أن تهدأ مع الأرز المغسول والخضرة المفرومة والنعناع.','احشِ الكوسة والباذنجان حتى الثلثين، ولفّ الكرنب وورق العنب بإحكام.','رصّ المحشي في الحلة وأضف مرقة ساخنة حتى منتصف الطبقة الأخيرة.','ابدأ بنار عالية حتى يغلي، ثم هدّئ النار واتركه حتى ينضج الأرز والخضار.'], budgetCategory:'وجبة بيتية',estimatedCostEgp:85,isVeryBudget:false,isQuick:false,usesLeftovers:false,tags:['غداء','محشي','كرنب','ورق عنب','مصري'],imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/EgyptianMahshyStuffedAubergineTomatoWithRice%20PhotoByWaelNawara.jpg?width=1000',svgFallbackIcon:'potatoes' },
  { id:'rec_pigeon_freekeh_encyclopedia', name:'حمام محشي بالفريك الصعيدي', mealType:'lunch', prepTimeMinutes:75, baseServings:4, ingredients:[{name:'حمام',quantity:'4 زغاليل منظفة',baseAmount:4,unit:'حمامة'},{name:'فريك',quantity:'كوب ونصف منقوع',baseAmount:1.5,unit:'كوب'},{name:'بصل',quantity:'بصلة مفرومة',baseAmount:1,unit:'حبة'},{name:'كبد وقوانص',quantity:'مفرومة من الحمام',baseAmount:4,unit:'حصة'},{name:'سمنة بلدي',quantity:'ملعقتان كبيرتان',baseAmount:2,unit:'ملعقة كبيرة'}], steps:['شوّح الكبد والقوانص مع البصل في السمنة.','أضف الفريك والبهارات ونصف كوب ماء واتركه نصف استواء.','احشُ الحمام دون تكديس، مع ترك مساحة لتمدد الفريك.','اسلق الحمام في ماء مغلي متبل حتى ينضج تماماً، نحو 35 دقيقة بحسب الحجم.','صفّه وحمّره في السمن أو الفرن حتى يصبح ذهبي اللون.'], budgetCategory:'وجبة مميزة',estimatedCostEgp:180,isVeryBudget:false,isQuick:false,usesLeftovers:false,tags:['غداء','حمام','فريك','صعيدي','مصري'],imageUrl:'https://cdn.alweb.com/thumbs/almatbakhalmasri/article/fit727x484/%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%AD%D9%85%D8%A7%D9%85-%D8%A7%D9%84%D9%85%D8%AD%D8%B4%D9%8A-%D8%A8%D8%A7%D9%84%D9%81%D8%B1%D9%8A%D9%83.jpg',svgFallbackIcon:'meat' },
  { id:'rec_fatta_meat_encyclopedia', name:'الفتة المصرية باللحمة ودقة الخل والثوم', mealType:'lunch', prepTimeMinutes:65, baseServings:4, ingredients:[{name:'لحم بقري أو ضأن',quantity:'500 جرام',baseAmount:500,unit:'جرام'},{name:'عيش بلدي',quantity:'4 أرغفة',baseAmount:4,unit:'رغيف'},{name:'أرز مصري',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'ثوم',quantity:'6 فصوص',baseAmount:6,unit:'فص'},{name:'خل أبيض',quantity:'ربع كوب',baseAmount:0.25,unit:'كوب'},{name:'عصير طماطم',quantity:'كوب',baseAmount:1,unit:'كوب'}], steps:['اسلق اللحم في ماء متبل حتى ينضج واحتفظ بالمرقة.','حمّص العيش المقطع مع قليل من السمن، واطهُ الأرز بالمرقة.','حمّر الثوم في السمن ثم أضف الخل وقليلًا من المرقة والكزبرة لعمل الدقة.','خذ جزءاً من الدقة وأضف إليه عصير الطماطم واتركه يتسبك كصلصة.','رصّ العيش واسقه بقليل من المرقة والدقة، ثم أضف الأرز والصلصة وقطع اللحم.'], budgetCategory:'وجبة رئيسية',estimatedCostEgp:120,isVeryBudget:false,isQuick:false,usesLeftovers:false,tags:['غداء','فتة','لحمة','مصري','عيد'],imageUrl:'https://res.cloudinary.com/ddjuftfy2/image/upload/f_webp%2Cc_fill/multitenacy/articles/2025-07-06-03-37-56-8686a98545a8e3.jpeg',svgFallbackIcon:'meat' },
  { id:'rec_macaroni_bechamel_encyclopedia', name:'مكرونة بالبشاميل المصرية الذهبية', mealType:'lunch', prepTimeMinutes:65, baseServings:6, ingredients:[{name:'مكرونة قلم',quantity:'500 جرام',baseAmount:500,unit:'جرام'},{name:'لحم مفروم',quantity:'400 جرام',baseAmount:400,unit:'جرام'},{name:'دقيق',quantity:'4 ملاعق كبيرة',baseAmount:4,unit:'ملعقة كبيرة'},{name:'سمنة',quantity:'4 ملاعق كبيرة',baseAmount:4,unit:'ملعقة كبيرة'},{name:'لبن',quantity:'4 أكواب دافئة',baseAmount:4,unit:'كوب'},{name:'بيض',quantity:'بيضة',baseAmount:1,unit:'بيضة'}], steps:['اسلق المكرونة في ماء مغلي مملح نصف سلقة ثم صفّها.','عصّج اللحم المفروم مع البصل والصلصة والتوابل حتى ينضج.','حمّر الدقيق في السمن دون أن يتغير لونه، ثم أضف اللبن تدريجياً مع الخفق حتى يصبح البشاميل ناعماً.','اخلط جزءاً من البشاميل مع المكرونة. ضع نصفها في صينية ثم اللحم ثم باقي المكرونة.','غطّ الوجه بالبشاميل وادهنه بالبيض أو القشطة، واخبز نحو 35 دقيقة حتى يحمر.'], budgetCategory:'وجبة عائلية',estimatedCostEgp:115,isVeryBudget:false,isQuick:false,usesLeftovers:false,tags:['غداء','مكرونة','بشاميل','مصري'],imageUrl:'https://www.tasteatlas.com/images/dishes/e17aaf1ebae446b0ab7377c5318a8d66.jpg',svgFallbackIcon:'pasta' },
  { id:'rec_roqaq_meat_encyclopedia', name:'صينية الرقاق البلدي باللحمة المفرومة', mealType:'lunch', prepTimeMinutes:55, baseServings:6, ingredients:[{name:'رقاق بلدي ناشف',quantity:'8 شرائح',baseAmount:8,unit:'شريحة'},{name:'مرقة لحم',quantity:'3 أكواب ساخنة',baseAmount:3,unit:'كوب'},{name:'لحم مفروم',quantity:'400 جرام',baseAmount:400,unit:'جرام'},{name:'سمنة بلدي',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'},{name:'بصل',quantity:'بصلة',baseAmount:1,unit:'حبة'}], steps:['عصّج اللحم المفروم بالبصل والبهارات حتى ينضج.','ادهن صينية بالسمن، واغمس كل شريحة رقاق سريعاً في المرقة الساخنة.','رص أربع طبقات في القاع مع مسحة سمن بين الطبقات.','وزّع اللحم ثم أضف أربع طبقات أخرى من الرقاق المبلل وادهن الوجه بالسمن.','اخبز في فرن متوسط حتى يصبح السطح ذهبياً ومقرمشاً.'], budgetCategory:'وجبة عائلية',estimatedCostEgp:95,isVeryBudget:false,isQuick:false,usesLeftovers:false,tags:['غداء','رقاق','لحمة','مصري','صواني'],imageUrl:'https://s3media.amwcdn.com/featured/615896/conversions/2e15ae9374-large-featured.webp',svgFallbackIcon:'pasta' },
  { id:'rec_bessara_encyclopedia', name:'البصارة المصرية بالتقلية المقرمشة', mealType:'dinner', prepTimeMinutes:55, baseServings:4, ingredients:[{name:'فول مدشوش',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'كرات',quantity:'حزمة',baseAmount:1,unit:'حزمة'},{name:'كزبرة خضراء وشبت',quantity:'حزمة مشكلة',baseAmount:1,unit:'حزمة'},{name:'بصل',quantity:'بصلتان',baseAmount:2,unit:'حبة'},{name:'ثوم',quantity:'4 فصوص',baseAmount:4,unit:'فص'},{name:'نعناع جاف',quantity:'ملعقة صغيرة',baseAmount:1,unit:'ملعقة صغيرة'}], steps:['اسلق الفول المدشوش مع الكرات والخضرة والبصل والثوم حتى يذوب وينضج.','اضرب الخليط بالخلاط حتى يصبح ناعماً وسميكاً.','أعده إلى الحلة وأضف النعناع الجاف والكمون والملح والملوخية الجافة الاختيارية.','قلّب على نار هادئة حتى يتماسك القوام، ثم اتركه يبرد قليلاً.','قدّم البصارة مزينة بالبصل المحمر المقرمش.'], budgetCategory:'اقتصادي جداً',estimatedCostEgp:28,isVeryBudget:true,isQuick:false,usesLeftovers:false,tags:['عشاء','بصارة','فول','مصري','اقتصادي'],imageUrl:'https://www.vetogate.com/Upload/libfiles/453/7/811.jpg',svgFallbackIcon:'soup' },
  { id:'rec_moussaka_meat_encyclopedia', name:'صينية المسقعة المصرية باللحمة المفرومة', mealType:'lunch', prepTimeMinutes:55, baseServings:4, ingredients:[{name:'باذنجان رومي',quantity:'2 حبة كبيرة',baseAmount:2,unit:'حبة'},{name:'فلفل أخضر',quantity:'حبتان',baseAmount:2,unit:'حبة'},{name:'لحم مفروم',quantity:'300 جرام',baseAmount:300,unit:'جرام'},{name:'عصير طماطم',quantity:'2 كوب',baseAmount:2,unit:'كوب'},{name:'ثوم',quantity:'4 فصوص',baseAmount:4,unit:'فص'},{name:'خل',quantity:'ملعقتان كبيرتان',baseAmount:2,unit:'ملعقة كبيرة'}], steps:['رشّ الباذنجان بالملح واتركه دقائق ثم جففه وحمّره أو اشوه حتى يكتسب لوناً.','حمّر الفلفل وجهّز اللحم المفروم المعصج.','شوّح الثوم وأضف الخل ثم عصير الطماطم والكمون واترك الصلصة تتسبك.','رصّ طبقة باذنجان وفلفل ثم اللحم ثم طبقة أخرى من الباذنجان.','اسكب الصلصة وأدخل الصينية الفرن نحو 25 دقيقة حتى تتشرب وتتحمر.'], budgetCategory:'وجبة رئيسية',estimatedCostEgp:90,isVeryBudget:false,isQuick:false,usesLeftovers:false,tags:['غداء','مسقعة','باذنجان','لحمة','مصري'],imageUrl:'https://cdn.al-ain.com/lg/images/2022/3/11/135-104725-moussaka-minced-meat-recipe-way-2.png',svgFallbackIcon:'potatoes' },
  { id:'rec_om_ali_encyclopedia', name:'طاجن أم علي المصري بالمكسرات والقشطة', mealType:'dinner', prepTimeMinutes:35, baseServings:6, ingredients:[{name:'جلاش أو رقاق أو ميلفوي مخبوز',quantity:'250 جرام',baseAmount:250,unit:'جرام'},{name:'لبن كامل الدسم',quantity:'4 أكواب',baseAmount:4,unit:'كوب'},{name:'سكر',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'},{name:'مكسرات وزبيب وجوز هند',quantity:'كوب مشكلة',baseAmount:1,unit:'كوب'},{name:'قشطة',quantity:'نصف كوب',baseAmount:0.5,unit:'كوب'}], steps:['كسّر رقائق الجلاش أو الميلفوي المخبوز في طاجن فرن.','أضف المكسرات والزبيب وجوز الهند وقلّبها مع الرقائق.','سخّن اللبن مع السكر والفانيليا واسكب الخليط حتى تتشرب الرقائق.','وزّع القشطة على الوجه وأدخل الطاجن تحت الشواية حتى يصبح ذهبياً.','قدّم أم علي دافئة بعد أن تهدأ قليلاً.'], budgetCategory:'حلويات',estimatedCostEgp:85,isVeryBudget:false,isQuick:true,usesLeftovers:false,tags:['حلويات','أم علي','مصري','طواجن'],imageUrl:'https://scoopempire.com/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-31-at-4.06.18-PM.jpeg',svgFallbackIcon:'pasta' }
);

RECIPES.push(...EXTRA_EGYPTIAN_RECIPES);

export const PRACTICAL_BUDGET_TIPS = [
  'قبل ما تشتري، راجع المخزون وحدد الناقص فعلاً عشان ما تكررش شراء الموجود.',
  'قارن سعر الكيلو أو اللتر، مش سعر العبوة بس؛ الحجم الأكبر مش دايماً أوفر.',
  'اختار خضار وفاكهة الموسم، واشتري الكمية اللي تقدر تستهلكها قبل ما تبوظ.',
  'قسّم ميزانية الأكل لأسبوعيات صغيرة، وسيب مبلغ احتياطي للطوارئ.',
  'حضّر قائمة مشتريات حسب الوجبات المكتوبة للأسبوع، مش حسب العروض.',
  'جمّد الخبز الزائد في أكياس مقسمة، وطلّع احتياج اليوم فقط.',
  'اطبخ كمية مناسبة لعدد أفراد البيت لتقليل بواقي الطعام.',
  'حوّل بواقي الأرز والخضار لوجبة جديدة آمنة بدل ما تترمي.',
  'انقع البقوليات واطبخ كمية تكفي أكثر من وجبة، ثم جمّدها في حصص.',
  'قارن أسعار البروتينات؛ البيض والعدس والفول بدائل اقتصادية في بعض الوجبات.',
  'اكتب كل مصروف فور حدوثه حتى لا تضيع المصروفات الصغيرة من الحساب.',
  'راجع إجمالي المصروفات في منتصف الأسبوع، وعدّل المتبقي قبل نهاية الأسبوع.',
  'خصص ظرفاً أو بنداً للفواتير الثابتة قبل الصرف على الكماليات.',
  'لو بند تجاوز ميزانيته، قلل الصرف منه تدريجياً ولا تسحب من بند أساسي دون تسجيل.',
  'راجع اشتراكات التطبيقات والإنترنت التي لا تستخدمها وأوقف غير الضروري.',
  'شغّل الغسالة بحمولة مناسبة، واستخدم درجة حرارة منخفضة عندما تسمح الملابس.',
  'افصل الشواحن والأجهزة غير المستخدمة، وتابع قراءة العداد لملاحظة الفرق.',
  'نظّف فلتر التكييف بانتظام واضبط الحرارة على درجة معتدلة.',
  'خزّن البقوليات في عبوات محكمة وجافة واكتب تاريخ الشراء عليها.',
  'رتّب الثلاجة بحيث تكون الأطعمة الأقرب لانتهاء الصلاحية في الأمام.',
  'حضّر صلصة الطماطم في موسمها وقسّمها في الفريزر لاستخدامها لاحقاً.',
  'اشترِ المنظفات الأساسية بالحجم الاقتصادي بعد مقارنة سعر اللتر أو الكيلو.',
  'لا تشتري عرضاً لمجرد الخصم؛ احسب هل ستستخدم المنتج قبل انتهاء صلاحيته.',
  'خصص مبلغاً أسبوعياً للمواصلات والمصروف الشخصي والتزم به قدر الإمكان.',
  'سجّل الدخل أولاً ثم اطرح الالتزامات الثابتة قبل تحديد مصروف البيت.',
  'اجعل الادخار بنداً واضحاً حتى لو كان مبلغاً صغيراً وثابتاً.',
  'راجع فواتير الشهر السابق وحدد بنداً واحداً فقط لتحسينه الشهر الحالي.',
  'استخدم قائمة مشتركة لأفراد الأسرة لتجميع طلبات البيت في مشوار واحد.',
  'اغسل الخضرة وجففها وخزنها بالطريقة المناسبة لتعيش مدة أطول.',
  'خطط لوجبتين من نفس المكونات الأساسية لتقليل شراء أصناف كثيرة.'
];

export const DAILY_IDEAS: DailyIdea[] = [
  {
    id: 'idea_1',
    title: 'تحويل العيش الفينو البايت لبقسماط متبل فاخر',
    category: 'طعام',
    description: 'بدل رمي العيش الفينو أو التوست الجاف، قطعه شرائح وحمصه في الفرن 10 دقائق، ثم اطحنه في المطحنة مع ملعقة نشا، ثوم بودرة، بصل بودرة، وبابريكا. هتحصل على بريد كرامبز منزلي أنضف وأوفر من الجاهز للبانيه والكفتة.',
    practicalTip: 'احفظه في برطمان زجاجي جاف تماماً يقعد معاك شهرين بدون ما يفسد.',
    timeRequired: '15 دقيقة',
    tags: ['مطبخ وتغذية', 'مطبخ', 'توفير', 'إعادة تدوير'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'food'
  },
  {
    id: 'idea_2',
    title: 'خلطة النظافة السحرية الاقتصادية للبوتاجاز والدهون',
    category: 'تنظيف',
    description: 'امزج نصف كوب خل أبيض مع ملعقتين بيكربونات صوديوم (كربوناتو من العطار) وملعقة صابون سائل. فوران المزيج يفكك أصعب الدهون المحروقة على عيون البوتاجاز بدون الحاجة لشراء مذيبات دهون كيميائية باهظة ومضرة بالصدر.',
    practicalTip: 'اترك الخليط 10 دقائق على البقع قبل الدعك بسلكة ناعمة.',
    timeRequired: '10 دقائق',
    tags: ['تنظيف', 'نظافة', 'منزل', 'اقتصادي'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'sparkle'
  },
  {
    id: 'idea_3',
    title: 'حساب استهلاك الكهرباء الخامل وتوفير 20% شهرياً',
    category: 'توفير',
    description: 'الأجهزة المتصلة بالكهرباء في وضع الاستعداد (الفيش المتروكة في الحائط، شواحن الموبايل، والراوتر طوال الليل) تستهلك ما يصل إلى 15% من فاتورة الكهرباء. افصل مشترك الكهرباء الرئيسي قبل النوم لتلاحظ فرق فوري في العداد.',
    practicalTip: 'استخدم مشترك بزر تشغيل/إطفاء لتسهيل فصل الأجهزة بضغطة واحدة.',
    timeRequired: '5 دقائق',
    tags: ['توفير كهرباء', 'كهرباء', 'فاتورة', 'توفير'],
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'wallet'
  },
  {
    id: 'idea_4',
    title: 'تحدي الـ 25 دقيقة لتنظيم دولاب واحد فقط',
    category: 'تنظيم البيت',
    description: 'لا تحاول ترتيب البيت كله مرة واحدة لتتجنب الإحباط. اضبط منبه الموبايل على 25 دقيقة واختر درفة أو رف واحد فقط: فرز، تخلص من الكراكيب غير المستخدمة، ومسح الرف وإعادة ترتيبه. النتيجة السريعة هتديك طاقة إيجابية عالية.',
    practicalTip: 'قاعدة الـ 6 شهور: أي قطعة ملابس لم ترتدها 6 شهور، تبرع بها لأسرة محتاجة.',
    timeRequired: '25 دقيقة',
    tags: ['تنظيف', 'بساطة', 'ترتيب', 'إنجاز'],
    imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef2?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'home'
  },
  {
    id: 'idea_5',
    title: 'حيلة مكعبات مرقة الخضار من قشور وسيقان الطبخ',
    category: 'طعام',
    description: 'احتفظ بكيس في الفريزر لسيقان البقدونس، قشور الجزر المغسولة، عروق البصل، ورؤوس الطماطم. عندما يمتلئ الكيس، اغلها ساعة مع ورق لورا وحبهان وفلفل، واخلطها مع زيت وملعقة كركم، وجمدها في قالب مكعبات ثلج.',
    practicalTip: 'مرقة طبيعية 100% بدون مواد حافظة وتوفر عليك شراء مكعبات المرقة التجارية.',
    timeRequired: '30 دقيقة',
    tags: ['مطبخ وتغذية', 'مطبخ', 'صحي', 'صفر هدر'],
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'food'
  },
  {
    id: 'idea_6',
    title: 'تلميع الخشب والأسطح بخلطة زيت الزيتون والليمون',
    category: 'تنظيف',
    description: 'اخلط ملعقة زيت زيتون أو زيت ذرة مع ملعقة عصير ليمون ونقطتين ماء في بخاخة صغيرة. امسح أثاث الخشب والترابيزات بقطعة قماش قطنية ناعمة للحصول على لمعان فندقي يدوم أيام بدون ملمعات كيميائية.',
    practicalTip: 'الليمون يزيل البقع الخفيفة والزيت يغذي ألياف الخشب ويمنع تشققه.',
    timeRequired: '10 دقائق',
    tags: ['تنظيف', 'خشب', 'طبيعي'],
    imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'sparkle'
  },
  {
    id: 'idea_7',
    title: 'طريقة الأظرف الذكية لتقسيم السيولة النقدية',
    category: 'توفير',
    description: 'قسّم فلوس المصروف الأسبوعي على 4 أظرف ورقية، كل ظرف مخصص لأسبوع فقط. لما يخلص ظرف الأسبوع، يمتنع الشراء الترفيهي حتى ميعاد الظرف التالي. هذه الطريقة تمنع نفاذ المرتب في منتصف الشهر تماماً.',
    practicalTip: 'اكتب على كل ظرف تاريخ بدايته ونهايته وقائمة المشتريات المسموحة.',
    timeRequired: '15 دقيقة',
    tags: ['حيل تسوق', 'ميزانية', 'كاش', 'انضباط'],
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'wallet'
  },
  {
    id: 'idea_8',
    title: 'تنظيم رف التوابل والبقوليات في برطمانات موحدة',
    category: 'تنظيم البيت',
    description: 'استغل برطمانات المربى والصلصة الزجاجية الفارغة، انزع الورق بالماء الساخن واستخدمها لحفظ العدس، الأرز، والتوابل. اكتب الاسم بورقة لاصقة صغيرة. المنظر الموحد بيسهل معرفة النواقص بلمحة عين ويمنع شراء صنف مكرر.',
    practicalTip: 'الزجاج يحفظ التوابل من الرطوبة والتسوس أفضل بمراحل من الأكياس البلاستيكية.',
    timeRequired: '20 دقيقة',
    tags: ['مطبخ وتغذية', 'تنظيم', 'مطبخ', 'برطمانات'],
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'home'
  },
  {
    id: 'idea_9',
    title: 'ضبط حرارة السخان والتكييف لتجنب شريحة الكهرباء الأعلى',
    category: 'توفير',
    description: 'ضبط سخان المياه على 50–55 درجة مئوية فقط، والتكييف على 25 درجة مع تنظيف الفلاتر شهرياً، يمنع العداد من القفز للشريحة الأعلى ويوفر حتى 250 جنيه شهرياً في فواتير الكهرباء صيفاً وشتاءً.',
    practicalTip: 'لا تترك السخان شغالاً 24 ساعة؛ شغله قبل الاستخدام بساعة وافصله.',
    timeRequired: '5 دقائق',
    tags: ['توفير كهرباء', 'كهرباء', 'أجهزة منزلية', 'توفير'],
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'wallet'
  },
  {
    id: 'idea_10',
    title: 'قاعدة النزول بـ كاش محدد والتسوق من محلات الجملة',
    category: 'توفير',
    description: 'عند نزولك لشراء مستلزمات الشهر أو الخضار الأسبوعي، اسحب المبلغ كاش فقط واترك الفيزا ومحافظ الموبايل في البيت. الشراء بالكاش يجبرك نفسياً على عدم شراء عروض السوبرماركت المغرية وغير الضرورية.',
    practicalTip: 'اشتري البقوليات والمنظفات من محلات الجملة والعطارة بدل الهايبر ماركت توفر 25% فوري.',
    timeRequired: '10 دقائق',
    tags: ['حيل تسوق', 'ميزانية', 'تسوق ذكي', 'كاش'],
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
    svgIcon: 'wallet'
  }
];

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'ch_1',
    title: 'جرد سريع لثلاجة البيت قبل ما تنزل تشتري',
    description: 'افتح الثلاجة ودوّن في ورقة كل علبة وكل صنف مستخبي في الأدراج. هتتفاجئ إن عندك أكل يكفيك يومين بدون ما تدفع جنيه في الشارع!',
    impactTag: 'وفرت مصاريف يوم كامل'
  },
  {
    id: 'ch_2',
    title: 'يوم بلا أكياس بلاستيكية ومقاطعة الهدر',
    description: 'اجمع أكياس القماش أو الشنط المتينة الموجودة عندك في البيت وحطها جنب الباب، واستخدمها في كل مشترياتك النهاردة.',
    impactTag: 'حماية البيئة وتوفير الفكة'
  },
  {
    id: 'ch_3',
    title: 'طبخة العدس أو الفول التوفيرية',
    description: 'استبدل وجبة الغداء النهاردة بطبق مصري أصيل غني بالبروتين النباتي زي الكشري أو شوربة العدس أو طاجن الفول بالسلطة.',
    impactTag: 'وفرت على الأقل 150 جنيه'
  },
  {
    id: 'ch_4',
    title: 'إلغاء عادة شراء غير ضرورية',
    description: 'راجع فواتيرك ومصروفك، هل بتشتري مشروب يومي غالي برة البيت؟ قرر تلغيه النهاردة وتعمل قهوتك أو شايك في البيت وتحول الفلوس للطوارئ.',
    impactTag: 'تحسين ذكي للميزانية'
  },
  {
    id: 'ch_5',
    title: 'فرز وتنظيم درج الأدوات المنزلية المشتركة',
    description: 'افرز درج المسامير، البطاريات، والأدوية المنزلية. رتّب الصالح منها عشان متشتريش حاجة مكررة بالخطأ وتعرف نواقصك الحقيقية.',
    impactTag: 'منع التكرار والهدر'
  },
  {
    id: 'ch_6',
    title: 'ساعة فصل شاشات عائلية في المساء',
    description: 'اقفلوا كل الموبايلات والتلفزيون لمدة 60 دقيقة كاملة بعد العشا، واقعدوا العبوا لعبة طاولة أو حكايات زمان مع كوباية شاي بالنعناع.',
    impactTag: 'هدوء بال وترابط عائلي'
  },
  {
    id: 'ch_7',
    title: 'استغلال العيش الفينو أو الخبز الزائد',
    description: 'حول الخبز الجاف في المطبخ لبقسماط ناعم أو مكعبات عيش محمص للشوربة والسلطة قبل أن يفسد.',
    impactTag: 'بركة في البيت وصفر هدر'
  },
  {
    id: 'ch_8',
    title: 'فصل فيش الأجهزة الكهربائية غير المستخدمة',
    description: 'افصل فيش الشواحن، الميكروويف، والكاتيل في الأوقات اللي مش بتستعملهم فيها. الاستهلاك الخامل بيزود فاتورة الكهرباء شهرياً.',
    impactTag: 'توفير في فاتورة الكهرباء'
  }
];

export function getDeterministicDailyChallenge(dateKey: string): DailyChallenge {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[index];
}
