vanilla.define({
    main: {
        'es-US': {
            identity: {version: {_cldrVersion: '38'}, language: 'es', territory: 'US'},
            dates: {
                calendars: {
                    gregorian: {
                        months: {
                            format: {
                                abbreviated: {
                                    1: 'ene.',
                                    2: 'feb.',
                                    3: 'mar.',
                                    4: 'abr.',
                                    5: 'may.',
                                    6: 'jun.',
                                    7: 'jul.',
                                    8: 'ago.',
                                    9: 'sep.',
                                    10: 'oct.',
                                    11: 'nov.',
                                    12: 'dic.'
                                },
                                narrow: {
                                    1: 'E',
                                    2: 'F',
                                    3: 'M',
                                    4: 'A',
                                    5: 'M',
                                    6: 'J',
                                    7: 'J',
                                    8: 'A',
                                    9: 'S',
                                    10: 'O',
                                    11: 'N',
                                    12: 'D'
                                },
                                wide: {
                                    1: 'enero',
                                    2: 'febrero',
                                    3: 'marzo',
                                    4: 'abril',
                                    5: 'mayo',
                                    6: 'junio',
                                    7: 'julio',
                                    8: 'agosto',
                                    9: 'septiembre',
                                    10: 'octubre',
                                    11: 'noviembre',
                                    12: 'diciembre'
                                }
                            },
                            'stand-alone': {
                                abbreviated: {
                                    1: 'ene.',
                                    2: 'feb.',
                                    3: 'mar.',
                                    4: 'abr.',
                                    5: 'may.',
                                    6: 'jun.',
                                    7: 'jul.',
                                    8: 'ago.',
                                    9: 'sep.',
                                    10: 'oct.',
                                    11: 'nov.',
                                    12: 'dic.'
                                },
                                narrow: {
                                    1: 'E',
                                    2: 'F',
                                    3: 'M',
                                    4: 'A',
                                    5: 'M',
                                    6: 'J',
                                    7: 'J',
                                    8: 'A',
                                    9: 'S',
                                    10: 'O',
                                    11: 'N',
                                    12: 'D'
                                },
                                wide: {
                                    1: 'enero',
                                    2: 'febrero',
                                    3: 'marzo',
                                    4: 'abril',
                                    5: 'mayo',
                                    6: 'junio',
                                    7: 'julio',
                                    8: 'agosto',
                                    9: 'septiembre',
                                    10: 'octubre',
                                    11: 'noviembre',
                                    12: 'diciembre'
                                }
                            }
                        },
                        days: {
                            format: {
                                abbreviated: {
                                    sun: 'dom',
                                    mon: 'lun',
                                    tue: 'mar',
                                    wed: 'mi??',
                                    thu: 'jue',
                                    fri: 'vie',
                                    sat: 's??b'
                                },
                                narrow: {
                                    sun: 'D',
                                    mon: 'L',
                                    tue: 'M',
                                    wed: 'M',
                                    thu: 'J',
                                    fri: 'V',
                                    sat: 'S'
                                },
                                wide: {
                                    sun: 'domingo',
                                    mon: 'lunes',
                                    tue: 'martes',
                                    wed: 'mi??rcoles',
                                    thu: 'jueves',
                                    fri: 'viernes',
                                    sat: 's??bado'
                                }
                            },
                            'stand-alone': {
                                abbreviated: {
                                    sun: 'dom.',
                                    mon: 'lun.',
                                    tue: 'mar.',
                                    wed: 'mi??.',
                                    thu: 'jue.',
                                    fri: 'vie.',
                                    sat: 's??b.'
                                },
                                narrow: {
                                    sun: 'D',
                                    mon: 'L',
                                    tue: 'M',
                                    wed: 'M',
                                    thu: 'J',
                                    fri: 'V',
                                    sat: 'S'
                                },
                                wide: {
                                    sun: 'domingo',
                                    mon: 'lunes',
                                    tue: 'martes',
                                    wed: 'mi??rcoles',
                                    thu: 'jueves',
                                    fri: 'viernes',
                                    sat: 's??bado'
                                }
                            }
                        },
                        dayPeriods: {format: {wide: {am: 'a.??m.', pm: 'p.??m.'}}},
                        eras: {eraAbbr: {0: 'a. C.', 1: 'd. C.'}},
                        dateFormats: {
                            full: "EEEE, d 'de' MMMM 'de' y",
                            long: "d 'de' MMMM 'de' y",
                            medium: 'd MMM y',
                            short: 'd/M/y'
                        },
                        timeFormats: {
                            full: 'h:mm:ss a zzzz',
                            long: 'h:mm:ss a z',
                            medium: 'h:mm:ss a',
                            short: 'h:mm a'
                        },
                        dateTimeFormats: {
                            full: "{1} 'a' 'las' {0}",
                            long: "{1} 'a' 'las' {0}",
                            medium: '{1} {0}',
                            short: '{1} {0}',
                            availableFormats: {
                                d: 'd',
                                E: 'ccc',
                                Ed: 'E d',
                                Ehm: 'E h:mm a',
                                EHm: 'E HH:mm',
                                Ehms: 'E h:mm:ss a',
                                EHms: 'E HH:mm:ss',
                                Gy: 'y G',
                                GyMMM: 'MMM y G',
                                GyMMMd: 'd MMM y G',
                                GyMMMEd: 'E, d MMM y G',
                                GyMMMM: "MMMM 'de' y G",
                                GyMMMMd: "d 'de' MMMM 'de' y G",
                                GyMMMMEd: "E, d 'de' MMMM 'de' y G",
                                h: 'h a',
                                H: 'HH',
                                hm: 'h:mm a',
                                Hm: 'HH:mm',
                                hms: 'h:mm:ss a',
                                Hms: 'HH:mm:ss',
                                hmsv: 'h:mm:ss a v',
                                Hmsv: 'HH:mm:ss v',
                                hmsvvvv: 'h:mm:ss a (vvvv)',
                                Hmsvvvv: 'HH:mm:ss (vvvv)',
                                hmv: 'h:mm a v',
                                Hmv: 'HH:mm v',
                                M: 'L',
                                Md: 'd/M',
                                MEd: 'E, d/M',
                                MMd: 'd/MM',
                                MMdd: 'dd/MM',
                                MMM: 'LLL',
                                MMMd: 'd MMM',
                                MMMdd: 'dd-MMM',
                                MMMEd: "E, d 'de' MMM",
                                MMMMd: "d 'de' MMMM",
                                MMMMEd: "E, d 'de' MMMM",
                                ms: 'mm:ss',
                                y: 'y',
                                yM: 'M/y',
                                yMd: 'd/M/y',
                                yMEd: 'E, d/M/y',
                                yMM: 'MM/y',
                                yMMM: "MMM 'de' y",
                                yMMMd: "d 'de' MMM 'de' y",
                                yMMMEd: "EEE, d 'de' MMM 'de' y",
                                yMMMM: "MMMM 'de' y",
                                yMMMMd: "d 'de' MMMM 'de' y",
                                yMMMMEd: "EEE, d 'de' MMMM 'de' y",
                                yQQQ: 'QQQ y',
                                yQQQQ: "QQQQ 'de' y"
                            },
                            appendItems: {Timezone: '{0} {1}'}
                        }
                    }
                },
                fields: {
                    year: {
                        'relative-type--1': 'el a??o pasado',
                        'relative-type-0': 'este a??o',
                        'relative-type-1': 'el a??o pr??ximo',
                        'relativeTime-type-future': {
                            'relativeTimePattern-count-one': 'dentro de {0} a??o',
                            'relativeTimePattern-count-other': 'dentro de {0} a??os'
                        },
                        'relativeTime-type-past': {
                            'relativeTimePattern-count-one': 'hace {0} a??o',
                            'relativeTimePattern-count-other': 'hace {0} a??os'
                        }
                    },
                    month: {
                        'relative-type--1': 'el mes pasado',
                        'relative-type-0': 'este mes',
                        'relative-type-1': 'el mes pr??ximo',
                        'relativeTime-type-future': {
                            'relativeTimePattern-count-one': 'dentro de {0} mes',
                            'relativeTimePattern-count-other': 'dentro de {0} meses'
                        },
                        'relativeTime-type-past': {
                            'relativeTimePattern-count-one': 'hace {0} mes',
                            'relativeTimePattern-count-other': 'hace {0} meses'
                        }
                    },
                    week: {
                        'relative-type--1': 'la semana pasada',
                        'relative-type-0': 'esta semana',
                        'relative-type-1': 'la semana pr??xima',
                        'relativeTime-type-future': {
                            'relativeTimePattern-count-one': 'dentro de {0} semana',
                            'relativeTimePattern-count-other': 'dentro de {0} semanas'
                        },
                        'relativeTime-type-past': {
                            'relativeTimePattern-count-one': 'hace {0} semana',
                            'relativeTimePattern-count-other': 'hace {0} semanas'
                        }
                    },
                    day: {
                        'relative-type--1': 'ayer',
                        'relative-type-0': 'hoy',
                        'relative-type-1': 'ma??ana',
                        'relativeTime-type-future': {
                            'relativeTimePattern-count-one': 'dentro de {0} d??a',
                            'relativeTimePattern-count-other': 'dentro de {0} d??as'
                        },
                        'relativeTime-type-past': {
                            'relativeTimePattern-count-one': 'hace {0} d??a',
                            'relativeTimePattern-count-other': 'hace {0} d??as'
                        }
                    },
                    sun: {'relative-type--1': 'el domingo pasado'},
                    mon: {'relative-type--1': 'el lunes pasado'},
                    tue: {'relative-type--1': 'el martes pasado'},
                    wed: {'relative-type--1': 'el mi??rcoles pasado'},
                    thu: {'relative-type--1': 'el jueves pasado'},
                    fri: {'relative-type--1': 'el viernes pasado'},
                    sat: {'relative-type--1': 'el s??bado pasado'},
                    hour: {
                        'relativeTime-type-future': {
                            'relativeTimePattern-count-one': 'dentro de {0} hora',
                            'relativeTimePattern-count-other': 'dentro de {0} horas'
                        },
                        'relativeTime-type-past': {
                            'relativeTimePattern-count-one': 'hace {0} hora',
                            'relativeTimePattern-count-other': 'hace {0} horas'
                        }
                    },
                    minute: {
                        'relativeTime-type-future': {
                            'relativeTimePattern-count-one': 'dentro de {0} minuto',
                            'relativeTimePattern-count-other': 'dentro de {0} minutos'
                        },
                        'relativeTime-type-past': {
                            'relativeTimePattern-count-one': 'hace {0} minuto',
                            'relativeTimePattern-count-other': 'hace {0} minutos'
                        }
                    },
                    second: {
                        'relative-type-0': 'ahora',
                        'relativeTime-type-future': {
                            'relativeTimePattern-count-one': 'dentro de {0} segundo',
                            'relativeTimePattern-count-other': 'dentro de {0} segundos'
                        },
                        'relativeTime-type-past': {
                            'relativeTimePattern-count-one': 'hace {0} segundo',
                            'relativeTimePattern-count-other': 'hace {0} segundos'
                        }
                    }
                }
            },
            numbers: {
                defaultNumberingSystem: 'latn',
                otherNumberingSystems: {native: 'latn'},
                'symbols-numberSystem-latn': {
                    decimal: '.',
                    group: ',',
                    percentSign: '%',
                    plusSign: '+',
                    minusSign: '-',
                    exponential: 'E',
                    perMille: '???',
                    infinity: '???',
                    nan: 'NaN'
                },
                'decimalFormats-numberSystem-latn': {
                    standard: '#,##0.###',
                    long: {
                        decimalFormat: {
                            '1000-count-one': '0 mil',
                            '1000-count-other': '0 mil',
                            '10000-count-one': '00 mil',
                            '10000-count-other': '00 mil',
                            '100000-count-one': '000 mil',
                            '100000-count-other': '000 mil',
                            '1000000-count-one': '0 mill??n',
                            '1000000-count-other': '0 millones',
                            '10000000-count-one': '00 millones',
                            '10000000-count-other': '00 millones',
                            '100000000-count-one': '000 millones',
                            '100000000-count-other': '000 millones',
                            '1000000000-count-one': '0 bill??n',
                            '1000000000-count-other': '0 billones',
                            '10000000000-count-one': '00 billones',
                            '10000000000-count-other': '00 billones',
                            '100000000000-count-one': '000 billones',
                            '100000000000-count-other': '000 billones',
                            '1000000000000-count-one': '0 trill??n',
                            '1000000000000-count-other': '0 trillones',
                            '10000000000000-count-one': '00 trillones',
                            '10000000000000-count-other': '00 trillones',
                            '100000000000000-count-one': '000 trillones',
                            '100000000000000-count-other': '000 trillones'
                        }
                    },
                    short: {
                        decimalFormat: {
                            '1000-count-one': '0??K',
                            '1000-count-other': '0??K',
                            '10000-count-one': '00??K',
                            '10000-count-other': '00??K',
                            '100000-count-one': '000??K',
                            '100000-count-other': '000??K',
                            '1000000-count-one': '0??M',
                            '1000000-count-other': '0??M',
                            '10000000-count-one': '00??M',
                            '10000000-count-other': '00??M',
                            '100000000-count-one': '000??M',
                            '100000000-count-other': '000??M',
                            '1000000000-count-one': '0??B',
                            '1000000000-count-other': '0??B',
                            '10000000000-count-one': '00??B',
                            '10000000000-count-other': '00??B',
                            '100000000000-count-one': '000??B',
                            '100000000000-count-other': '000??B',
                            '1000000000000-count-one': '0??T',
                            '1000000000000-count-other': '0??T',
                            '10000000000000-count-one': '00??T',
                            '10000000000000-count-other': '00??T',
                            '100000000000000-count-one': '000??T',
                            '100000000000000-count-other': '000??T'
                        }
                    }
                },
                'percentFormats-numberSystem-latn': {standard: '#,##0??%'},
                'currencyFormats-numberSystem-latn': {
                    standard: '??#,##0.00',
                    'unitPattern-count-one': '{0} {1}',
                    'unitPattern-count-other': '{0} {1}'
                },
                currencies: {
                    AUD: {displayName: 'd??lar australiano', symbol: 'AUD'},
                    BRL: {displayName: 'real brasile??o', symbol: 'BRL'},
                    CAD: {displayName: 'd??lar canadiense', symbol: 'CAD'},
                    CHF: {displayName: 'franco suizo', symbol: 'CHF'},
                    CNY: {displayName: 'yuan', symbol: 'CNY'},
                    CZK: {displayName: 'corona checa', symbol: 'CZK'},
                    DKK: {displayName: 'corona danesa', symbol: 'DKK'},
                    EUR: {displayName: 'euro', symbol: 'EUR'},
                    GBP: {displayName: 'libra esterlina', symbol: 'GBP'},
                    HKD: {displayName: 'd??lar hongkon??s', symbol: 'HKD'},
                    HUF: {displayName: 'forinto h??ngaro', symbol: 'HUF'},
                    IDR: {displayName: 'rupia indonesia', symbol: 'IDR'},
                    INR: {displayName: 'rupia india', symbol: 'INR'},
                    JPY: {displayName: 'yen', symbol: '??'},
                    KRW: {displayName: 'won surcoreano', symbol: 'KRW'},
                    MXN: {displayName: 'peso mexicano', symbol: 'MXN'},
                    NOK: {displayName: 'corona noruega', symbol: 'NOK'},
                    PLN: {displayName: 'esloti', symbol: 'PLN'},
                    RUB: {displayName: 'rublo ruso', symbol: 'RUB'},
                    SAR: {displayName: 'rial saud??', symbol: 'SAR'},
                    SEK: {displayName: 'corona sueca', symbol: 'SEK'},
                    THB: {displayName: 'bat', symbol: 'THB'},
                    TRY: {displayName: 'lira turca', symbol: 'TRY'},
                    TWD: {displayName: 'nuevo d??lar taiwan??s', symbol: 'TWD'},
                    USD: {displayName: 'd??lar estadounidense', symbol: '$'},
                    ZAR: {displayName: 'rand', symbol: 'ZAR'}
                }
            },
            units: {
                narrow: {
                    'digital-terabyte': {
                        'unitPattern-count-one': '{0} TB',
                        'unitPattern-count-other': '{0} TB'
                    },
                    'digital-terabit': {
                        'unitPattern-count-one': '{0} Tb',
                        'unitPattern-count-other': '{0} Tb'
                    },
                    'digital-gigabyte': {
                        'unitPattern-count-one': '{0} GB',
                        'unitPattern-count-other': '{0} GB'
                    },
                    'digital-gigabit': {
                        'unitPattern-count-one': '{0} Gb',
                        'unitPattern-count-other': '{0} Gb'
                    },
                    'digital-megabyte': {
                        'unitPattern-count-one': '{0} MB',
                        'unitPattern-count-other': '{0} MB'
                    },
                    'digital-megabit': {
                        'unitPattern-count-one': '{0} Mb',
                        'unitPattern-count-other': '{0} Mb'
                    },
                    'digital-kilobyte': {
                        'unitPattern-count-one': '{0} kB',
                        'unitPattern-count-other': '{0} kB'
                    },
                    'digital-kilobit': {
                        'unitPattern-count-one': '{0} kb',
                        'unitPattern-count-other': '{0} kb'
                    },
                    'digital-byte': {
                        'unitPattern-count-one': '{0} B',
                        'unitPattern-count-other': '{0} B'
                    },
                    'digital-bit': {
                        'unitPattern-count-one': '{0} b',
                        'unitPattern-count-other': '{0} b'
                    }
                }
            }
        }
    }
});
