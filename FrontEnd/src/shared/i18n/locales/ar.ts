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
    'common.signOut': 'تسجيل الخروج',
    'common.primaryNav': 'التنقل الرئيسي',

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
    'metric.activeBins': 'الحاويات الذكية النشطة',
    'metric.criticalBins': 'حاويات حرجة',
    'metric.studentsParticipating': 'الطلاب المشاركون',
    'metric.unit.kg': 'كجم',
    'metric.note.criticalBins': 'مقارنةً بالشهر الماضي',
    'metric.note.needsAttention': 'بحاجة إلى متابعة',
    'metric.note.studentsParticipating': 'مقارنةً بالشهر الماضي',
    'metric.note.allTime': 'منذ البداية',
    'metric.note.thisMonth': 'هذا الشهر',
    'metric.note.operational': 'قيد التشغيل',
    'metric.goalProgress': '{percent}% من الهدف الشهري',
    'metric.loading': 'جارٍ تحميل المؤشرات…',
    'metric.error': 'تعذّر تحميل المؤشرات.',

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
      'يأخذ المؤشّر لون الحاوية الأكثر إلحاحًا في ذلك الموقع',
    'map.legend.healthy': 'سليمة',
    'map.legend.attention': 'بحاجة لمتابعة',
    'map.legend.critical': 'حرجة',
    'map.legend.offline': 'غير متصلة',
    'map.legend.updated': 'آخر تحديث الآن',
    'map.legend.live': 'مباشر',
    'map.marker.title': 'حاوية {number} · {name}',
    'map.popup.high': 'مرتفع',
    'map.popup.offline': 'غير متصلة',
    'map.popup.fullest': 'الحاوية الأكثر امتلاءً {fill}%',
    'map.notice.missingKey.title': 'تحتاج خريطة الحرم إلى مفتاح API',
    'map.notice.missingKey.detail':
      'أضف VITE_GOOGLE_MAPS_API_KEY إلى FrontEnd/.env.local ثم أعد تشغيل خادم التطوير — راجع FrontEnd/.env.example.',
    'map.notice.error.title': 'خريطة الحرم غير متاحة',
    'map.notice.error.detail':
      'تعذّر تحميل خرائط Google. تحقّق من مفتاح API ومن الاتصال ومن تفعيل واجهة Maps JavaScript API للمفتاح.',
    'map.notice.loading.title': 'جارٍ تحميل خريطة الحرم',
    'map.notice.loading.detail': 'جارٍ جلب مواقع الحاويات الحالية.',
    'map.notice.fetchError.title': 'تعذّر تحميل شبكة الحاويات',
    'map.notice.fetchError.detail':
      'لم يستجب الـ API المباشر للحاويات. تحقّق من الاتصال ومن تشغيل الخادم.',
    'map.notice.empty.title': 'لا توجد حاويات مسجّلة بعد',
    'map.notice.empty.detail':
      'أضف حاويات إلى مجموعة Bins ثم أعد تحميل هذه الخريطة.',
    'map.notice.retry': 'إعادة المحاولة',

    'waste.eyebrow': 'أثر إعادة التوجيه',
    'waste.title': 'النفايات المفروزة عبر الوقت',
    'waste.totalUnit': 'كجم إجمالاً',
    'waste.seriesLabel': 'النفايات المفروزة (كجم)',
    'waste.periodAria': 'الفترة الزمنية للمخطط',
    'waste.empty': 'لا توجد نفايات مفروزة في هذه الفترة',
    'waste.updatedToast': 'تم تحديث مخطط النفايات إلى {period}',
    'waste.period.last30': 'آخر 30 يومًا',
    'waste.period.last7': 'آخر 7 أيام',
    'waste.period.thisYear': 'هذا العام',

    'points.eyebrow': 'تفاعل الطلاب',
    'points.title': 'النقاط الموزّعة',
    'points.vsPrevious': 'مقارنةً بالفترة السابقة',
    'points.seriesLabel': 'النقاط المكتسبة',
    'points.legend': 'نقاط مكتسبة من الفرز',
    'points.goal': 'الهدف: {goal}',

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
  },
};
