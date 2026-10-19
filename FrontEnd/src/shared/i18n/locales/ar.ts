/**
 * Arabic message catalog.
 *
 * Typed as `Catalog`, so it must define exactly the keys the English catalog
 * does — the build fails if a string is added, removed or mistyped. Plurals use
 * the full Arabic set (zero/one/two/few/many/other); `Intl.PluralRules` selects
 * the right form from the count.
 *
 * The brand wordmark "Think Outside The Box" is a proper noun and stays in
 * Latin script inside composed messages.
 */

import type { Catalog } from './en';

export const ar: Catalog = {
  strings: {
    'app.title': 'Think Outside The Box · ذكاء نفايات الحرم الجامعي',

    'common.language': 'اللغة',
    'common.theme': 'المظهر',
    'common.signOut': 'تسجيل الخروج',
    'common.primaryNav': 'التنقل الرئيسي',

    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.system': 'النظام',

    'brand.kicker': 'نظام الحرم الجامعي الذكي',

    'topbar.greeting': 'صباح الخير، {campus}',
    'topbar.export': 'تصدير التقرير',
    'topbar.exportToast': 'تم تجهيز تصدير التقرير · {file}',

    'nav.overview': 'نظرة عامة',
    'nav.campus-map': 'الخريطة',
    'nav.hardware': 'الأجهزة',
    'nav.analytics': 'التحليلات',

    'metric.diversionRate': 'معدل تحويل النفايات',
    'metric.wasteSorted': 'النفايات المفروزة',
    'metric.pointsDistributed': 'النقاط الموزّعة',
    'metric.activeBins': 'المحطات المتصلة',
    'metric.criticalBins': 'محطات حرجة',
    'metric.studentsParticipating': 'طلاب لديهم نقاط',
    'metric.unit.kg': 'كجم',
    'metric.note.criticalBins': 'أعلى امتلاء معروف',
    'metric.note.needsAttention': 'بحسب أعلى امتلاء معروف',
    'metric.note.studentsParticipating': 'طلاب في سجل النقاط',
    'metric.note.allTime': 'الإجمالي الكلي',
    'metric.note.thisMonth': 'الإجمالي الكلي',
    'metric.note.operational': 'محطات متصلة بالكامل',
    'metric.note.stationConnectivity':
      '{online} متصلة بالكامل · {partial} جزئية · {offline} غير متصلة',
    'metric.note.containerFill':
      'الحاويات: {healthy} سليمة · {attention} بحاجة لمتابعة · {critical} حرجة · {unknown} بلا قراءة',
    'metric.note.containerConnectivity':
      '{online}/{total} حاوية متصلة · {offline} غير متصلة · {never} لم تتصل بعد',
    'metric.note.studentsWithPoints': 'طلاب لديهم نقاط',
    'metric.goalProgress': '{percent}% من الهدف الشهري',
    'metric.loading': 'جارٍ تحميل المؤشرات…',
    'metric.error': 'تعذّر تحميل المؤشرات.',
    'metric.alert.unassigned':
      'حاويات غير مرتبطة بأي محطة، لذلك لا تظهر على الخريطة: {count}',
    'metric.alert.orphaned': 'حاويات تشير إلى محطة لم تعد موجودة: {count}',

    'map.eyebrow': 'شبكة استشعار آنية',
    'map.title': 'خريطة الحرم الجامعي المباشرة',
    'map.view.campus': 'عرض الحرم',
    'map.view.satellite': 'قمر صناعي',
    'map.zoomIn': 'تكبير',
    'map.zoomOut': 'تصغير',
    'map.viewEnabledToast': 'تم تفعيل {view}',
    'map.zoomedInToast': 'تم تكبير الخريطة',
    'map.zoomedOutToast': 'تم تصغير الخريطة',
    'map.legend.tooltip':
      'لون المؤشّر يعبّر عن أعلى شدة امتلاء معروفة في المحطة؛ وتظهر حالة الاتصال على المؤشّر وفي النافذة',
    'map.legend.healthy': 'سليمة',
    'map.legend.attention': 'بحاجة لمتابعة',
    'map.legend.critical': 'حرجة',
    'map.legend.offline': 'غير متصلة',
    'map.legend.noReading': 'لا توجد قراءة',
    'map.legend.updated': 'تحديث تلقائي',
    'map.legend.live': 'كل 30 ثانية',
    'map.marker.title': 'محطة {number} · {name}',
    'map.connectivity.online': 'متصلة',
    'map.connectivity.partial': 'متصلة جزئيًا',
    'map.connectivity.offline': 'غير متصلة',
    'map.connectivity.never-connected': 'لم تتصل بعد',
    'map.severity.healthy': 'سليمة',
    'map.severity.attention': 'بحاجة لمتابعة',
    'map.severity.critical': 'حرجة',
    'map.severity.unknown': 'لا توجد قراءة',
    'map.wasteType.paper': 'ورق',
    'map.wasteType.plastic': 'بلاستيك',
    'map.wasteType.liquids': 'سوائل',
    'map.popup.unclassified': 'غير مصنّف',
    'map.popup.noReading': 'لا توجد قراءة',
    'map.popup.lastKnown': 'آخر قراءة معروفة {fill} · {time}',
    'map.popup.current': 'آخر تحديث {time}',
    'map.popup.neverConnected': 'لم تتصل بعد · لا توجد قراءة',
    'map.popup.offlineNoReading': 'غير متصلة · لا توجد قراءة',
    'map.popup.stationSeverity': 'شدة المحطة: {severity}',
    'map.popup.incomplete': 'محطة غير مكتملة: {actual} من {expected} حاويات',
    'map.popup.high': 'مرتفع',
    'map.popup.offline': 'غير متصلة',
    'map.popup.fullest': 'أكثر حاوية امتلاءً {fill}%',
    'map.notice.missingKey.title': 'تحتاج خريطة الحرم إلى مفتاح API',
    'map.notice.missingKey.detail':
      'أضف VITE_GOOGLE_MAPS_API_KEY إلى FrontEnd/.env.local ثم أعد تشغيل خادم التطوير — راجع FrontEnd/.env.example.',
    'map.notice.error.title': 'خريطة الحرم غير متاحة',
    'map.notice.error.detail':
      'تعذّر تحميل خرائط Google. تحقّق من مفتاح API ومن الاتصال ومن تفعيل واجهة Maps JavaScript API للمفتاح.',
    'map.notice.loading.title': 'جارٍ تحميل خريطة الحرم',
    'map.notice.loading.detail': 'جارٍ جلب حالات المحطات والحاويات الحالية.',
    'map.notice.fetchError.title': 'تعذّر تحميل شبكة المحطات',
    'map.notice.fetchError.detail':
      'لم يستجب الـ API المباشر للمحطات. تحقّق من الاتصال ومن تشغيل الخادم.',
    'map.notice.empty.title': 'لا توجد محطات مُعدّة بعد',
    'map.notice.empty.detail':
      'أنشئ سجلات المحطات واربط ثلاث حاويات بكل محطة، ثم أعد تحميل هذه الخريطة.',
    'map.notice.noCoordinates.title': 'المحطات بلا إحداثيات',
    'map.notice.noCoordinates.detail':
      'كل محطة مُرجعة تفتقد موقعًا صالحًا على الخريطة. أضف الإحداثيات إلى سجلات المحطات.',
    'map.notice.skipped': 'محطات بلا إحداثيات غير معروضة: {count}',
    'map.notice.retry': 'إعادة المحاولة',
    'map.notice.refreshFailed': 'فشل التحديث — يتم عرض آخر المحطات المحمّلة',

    'waste.eyebrow': 'اتجاه الامتلاء',
    'waste.title': 'متوسط مستوى الامتلاء بمرور الوقت',
    'waste.averageUnit': '% (متوسط)',
    'waste.seriesLabel': 'متوسط مستوى الامتلاء (%)',
    'waste.periodAria': 'الفترة الزمنية لمخطط الامتلاء',
    'waste.empty': 'لا توجد قراءات لمستوى الامتلاء في هذه الفترة',
    'waste.loading': 'جارٍ تحميل سجل مستوى الامتلاء…',
    'waste.error': 'تعذّر تحميل سجل مستوى الامتلاء.',
    'waste.updatedToast': 'تم تحديث مخطط الامتلاء إلى {period}',
    'waste.period.last30': 'آخر 30 يومًا',
    'waste.period.last7': 'آخر 7 أيام',
    'waste.period.thisYear': 'هذا العام',

    'points.eyebrow': 'تفاعل الطلاب',
    'points.title': 'النقاط الموزّعة',
    'points.allTime': 'الإجمالي الكلي',
    'points.seriesLabel': 'النقاط المكتسبة',
    'points.legend': 'نقاط مكتسبة من الفرز',
    'points.loading': 'جارٍ تحميل النقاط اليومية…',
    'points.error': 'تعذّر تحميل النقاط اليومية.',
    'points.empty': 'لا توجد نقاط مكتسبة في هذه الفترة',

    'footer.dashboard': 'Think Outside The Box · لوحة عمليات الحرم الجامعي',
    'footer.edgeNetwork': 'شبكة الذكاء الطرفي',
    'footer.operational': 'تعمل',

    'auth.kicker': 'ذكاء نفايات الحرم الجامعي',
    'auth.title': 'تسجيل دخول المشغّل',
    'auth.subtitle':
      'سجّل الدخول للوصول إلى شبكة الحاويات المباشرة، وحالة الأجهزة، وسجل نقاط الطلاب.',
    'auth.formAria': 'تسجيل دخول المشغّل',
    'auth.email.label': 'البريد الإلكتروني للمشغّل',
    'auth.email.placeholder': 'name@campus.edu',
    'auth.password.label': 'كلمة المرور',
    'auth.password.placeholder': 'أدخل كلمة المرور',
    'auth.forgot': 'هل نسيت كلمة المرور؟',
    'auth.submit': 'تسجيل الدخول',
    'auth.submitting': 'جارٍ تسجيل الدخول…',
    'auth.security':
      'الوصول مقتصر على مشغّلي الحرم الجامعي المصرّح لهم. بحاجة إلى حساب؟ تواصل مع مسؤول المرافق.',
    'auth.footer.publisher': 'Think Outside The Box · عمليات الحرم الجامعي',
    'auth.footer.tagline': 'شبكة حاويات تعمل دون اتصال أولاً',
    'auth.toast.passwordReset': 'إعادة تعيين كلمة المرور غير متاحة في هذا الإصدار',
    'auth.toast.missingFields': 'يرجى تعبئة جميع الحقول',
    'auth.toast.invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth.toast.networkError':
      'تعذّر الوصول إلى الخادم. تحقّق من الـ API واتصالك.',
    'auth.toast.loginFailed': 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
  },
  plurals: {
    'bins.healthy': {
      zero: 'لا حاويات سليمة',
      one: 'حاوية سليمة واحدة',
      two: 'حاويتان سليمتان',
      few: '{count} حاويات سليمة',
      many: '{count} حاوية سليمة',
      other: '{count} حاوية سليمة',
    },
    'bins.attention': {
      zero: 'لا حاويات بحاجة لمتابعة',
      one: 'حاوية واحدة بحاجة لمتابعة',
      two: 'حاويتان بحاجة لمتابعة',
      few: '{count} حاويات بحاجة لمتابعة',
      many: '{count} حاوية بحاجة لمتابعة',
      other: '{count} حاوية بحاجة لمتابعة',
    },
    'stations.healthy': {
      zero: 'لا محطات سليمة',
      one: 'محطة سليمة واحدة',
      two: 'محطتان سليمتان',
      few: '{count} محطات سليمة',
      many: '{count} محطة سليمة',
      other: '{count} محطة سليمة',
    },
    'stations.attention': {
      zero: 'لا محطات بحاجة لمتابعة',
      one: 'محطة واحدة بحاجة لمتابعة',
      two: 'محطتان بحاجة لمتابعة',
      few: '{count} محطات بحاجة لمتابعة',
      many: '{count} محطة بحاجة لمتابعة',
      other: '{count} محطة بحاجة لمتابعة',
    },
  },
};
