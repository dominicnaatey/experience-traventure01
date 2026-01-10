
import { Destination, TourPackage, Testimonial } from '../types';

export const FEATURED_DESTINATIONS: Destination[] = [
  {
    id: '1',
    name: 'Bali',
    country: 'Indonesia',
    tourCount: 50,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPz57HIifDMEurOUMwIllQkWVjsAzB8h0hte0FJZhtEOTfkyH6HPdQnU9hRLX0HvBoYY6iDiheaV2eoY2Kg0GQ_rYbUq2-w1mp7dp4W8DAj6Jnt6YHBjxZOQxn2kP_v6FGn3T3-Bp15JRUHg4uhVebJPSxgF0-saqttlpbJOSY2jpOvM1Dacec0-B1sMRwa_5NqinKRNowU7E2sIBEJKOd1PMiEXCkKFyJHbPmK2DddhneQ1czitzT8rcRNIwrHWUNpRZQWuaRgg'
  },
  {
    id: '2',
    name: 'Santorini',
    country: 'Greece',
    tourCount: 35,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP6V6XDMjgv6_X3xaWICEM5Am-MSTSSS31YMohcz03IvHPlZ5w2pyt1ZvfQHdV3cYHSWCknUEZG7gIhCJCQhlUbdYfDWAshlKDQ_HndpSEd9KnMNZ_rpnH2MNTC49EvAR9s2aPYI0CaZUjAjo7I0O7h-JNIn34hbt9r7IFzBE9wJlBTi8Zmdfet6_c6MkauPB21aQGnRIOYnUPFs3Xk3mmXxf2r4F3XiMMzboac6gV5RH80DqfSrjGFg8lhqt798SH3eHEhE7QCA'
  },
  {
    id: '3',
    name: 'Kyoto',
    country: 'Japan',
    tourCount: 42,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7Kd42sXP02-arfXX-EDoDnGytcs12iF24KTZxTAwoWv4h8B2QUHrjdDISTLr5AZbRs0BooCUttUz0JoLA51k_UEwxkwEbL74XR51AFH7kcWKRApdZz8_ZbPmAUYt0QdiRZvMBCX7ZtZJPbYG4Yu5u372cvGNwFZ8StLlMcXRp9P01adUDEuQ88Qp-_T4PBEIbGlte060II3ftJkUItowC59pPqUz6oVhCVxg1WAKIh3E4uyNPh59SFPMZyng-_kcKbTr5pz4hTg'
  },
  {
    id: '4',
    name: 'Patagonia',
    country: 'Chile',
    tourCount: 20,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_JtsuF_Bt_vCXwy012af_NFvbmVtsOdF-1V2j22wcxwPxMehwLacA9h-hIIreG6RqXVIobljToBNWtzc41a_80lGQPT5v1MvS2GcXNVJSPD58WTQUJlalPu2Xf-YsZTe_VZmbTSP1OJ45lBjQNRYHiPBQWT6UdyLOCyvm0C5uMiB2v7ndVJSJRoZf03Ahy6VmcQrNcixFvgUU_DIpYEKsiegE1QOjq_szV3s4ssvm_P2rxmClklsT67ltZ7uTPjMEOk6ETjLYTQ'
  }
];

export const TOUR_PACKAGES: TourPackage[] = [
  {
    id: '101',
    title: 'Italian Renaissance Tour',
    location: 'Rome, Italy',
    duration: '5 Days',
    price: 499,
    rating: 4.8,
    description: 'Explore the ancient ruins of Rome, the art of Florence, and the canals of Venice in this comprehensive tour.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmz0ZIW29IqvNrBec2934dFpmCngtZ5x1CzjD9dMunJSlpxWTlNhXg20YEei_tjCOawbo8wGegInaLfcoc7hcCQmXBhwuEv63z3EP7BskplABtpYhQCx9TRZEV3gS4Yx-XfE64-pc1ONF2Nvnq3_UO3cl-H63wvBL8icomUgrfo7q-EsfypcY3fJdtjf-kt70OhH5EGNrps1KgtAKi_GvDplj2-m8uqdPDJJkdq6uFXT7NAkWevSPVLH5dFX6WQNv3tO-c8j5HkA'
  },
  {
    id: '102',
    title: 'Romantic Paris Getaway',
    location: 'Paris, France',
    duration: '4 Days',
    price: 599,
    rating: 4.9,
    description: 'Experience the city of lights with a sunset cruise on the Seine and skip-the-line Eiffel Tower access.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXNRAhY3BrEEtKAm1vKuFosrk53O400GvGhs0PYOGhoSCK7Mkt0rhIilzNov-z2M_z7yOP8pAPNJyH6eYppmCddt0OIUpXwh5XZCVSTPYjD-yJY1khPJ_adehY1W-fEVBqRVMvXxXG7lQsTy-oSo6GXsEkFIxgT_SzSs7f4yXiF56Hf0VtKBpinKUNu-Tqv9rg7YaCPI67pI6RFTW3WtShy2-Pvb4cVNWltFGPo33LvcXkoWMB1T7QKvyS-7mFiX91hXEs9bwmXA'
  },
  {
    id: '103',
    title: 'Luxury Island Retreat',
    location: 'Male, Maldives',
    duration: '7 Days',
    price: 1200,
    rating: 5.0,
    description: 'Relax in an overwater bungalow with all-inclusive dining and private snorkeling excursions.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqKaIIVAd6BNcIYl8mfBkkKLpwzXHSAPxDwHBqwYucsMaPBEOJHZFyrSZbHcYBZ5Y9YgpY-jrgickIuhuANyNyiBR1eAO13NnGkynE-_f7ljVg03UU-yLS6ajsRIIuWffhWb-z1knt2xIAVsSHRjwxiNL5eKjIEMbK7ECe8ay1QbKRGAZEK-zIQqam0ImtPLCGaih1PntSZb6i1CoZL5UMY50M2eLNk5PJzA3sqlpetN6-Vl6zmRCeuWoqc5UOXPaFR61C77atsA'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Sarah Jenkins',
    location: 'Traveled to Japan',
    rating: 5,
    comment: "The trip of a lifetime! Everything was perfectly organized from airport pickup to the daily excursions. Highly recommended!",
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCypkiONU-N2uXUrB2XDOULLtuzuzd_68KVmmagvEuj4BcLivX5GwwfwI96E2iJzfHKH7N0w0sM4iooSmavQHWeLkOufGQ9ifa2MrLARk1KgMowh33ly6cwUUBEAjAIcc348xuzHSKE2XTnTeRvi_69SITv2cqRMRMOlkHz-OtReyzXhW3t2-wOXD9teZigwa6-wha0KG2DLenHPufetr9eNQejcBkqc6LeLYssLxkvrWcUE3_UXsSzINEQ5pb9aQGb1KxgsjmsVg'
  },
  {
    id: 't2',
    name: 'Mike Thompson',
    location: 'Traveled to Italy',
    rating: 4.5,
    comment: "Great value for money. The guides were knowledgeable and friendly. The hotels were comfortable and centrally located.",
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAq6zGYbjZhn1TV4RuakFybNKiP29OI9LDNtyynB0OLVMbdWsBiHtrDfVSDbtMxLzI-phxKkcgL3FlCmfGjD1K7xrENfeA2rJCOtdaBBz5b4WszcjiiR3Rtv9E8VMEhT780dGEKD5_IFz0oP4tsdRJm-8RtPlDN27D4SRbN23h73oypuSOIOg7P5Gct_w7QaDmvKO5Vpv2RWvlnQDzF-Gfk0OWxG5sgngH6tOn6i7eYco44xlIk5NIGp1tq_ash1uv2vqiDcw7VZA'
  },
  {
    id: 't3',
    name: 'Emily Rodriguez',
    location: 'Traveled to Bali',
    rating: 5,
    comment: "Booking was easy and transparent. No hidden fees. The customer support team helped me customize my itinerary perfectly.",
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsdARinnBr16DLqyZ7zrXfWTfSCapB6QIRo3BphmJHQNRTIfgaPMn59MsIOIpU1_4xtZHZEskk7CWzN3L7CRUuornUh-eQ2bOZAhfPbmxHsBuEopC3elDguOvXcJq2aUif0gDlsbJvyn-zsEV2d0a18RgY2UblK1rAWdQlaSGXJbeTfgqZP43x1ABzDF1ZkWaRBMXBIdISKfOqgNgjCm78Rs9iompvltva3nIaT49ZDatxcG3Kwq5CK2xAm4qnkbf3l2dbBjf40A'
  }
];
