import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Plus,
  Trash2,
  Copy,
  RotateCw,
  Save,
  Upload,
  Download,
  Camera,
  Eye,
  Box,
  Move,
  Grid3x3,
  Layers,
  Home,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Maximize2,
  FilePlus,
  Settings,
  X,
  FolderOpen,
  Footprints,
  Check,
  Pencil,
} from 'lucide-react';

/* ============================================================
   SIZE OPTIONS  ── per spec sheet
   ============================================================ */
const SPEEDRACK_SIZES = {
  width: [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1500],
  depth: [300, 400, 500, 600, 800, 900],
  height: [
    330, 420, 600, 750, 900, 1200, 1350, 1500, 1650, 1800, 1950, 2100, 2400,
  ],
};

const HOMEDANT_HOUSE_SIZES = {
  width: [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
  depth: [300, 400, 450, 500, 600, 700],
  height: [600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800, 1950, 2100],
};

// perforated beams come in 300 to 900 mm lengths
const HOMEDANT_PERF_SIZES = {
  ...HOMEDANT_HOUSE_SIZES,
  width: HOMEDANT_HOUSE_SIZES.width.filter((v) => v <= 900),
};

// MAX 200 (light rack): beams 700-1500, depth supports 300/450/600,
// posts 900-2400 (from the part files)
const LR_SIZES = {
  width: [700, 900, 1200, 1500],
  depth: [300, 450, 600],
  height: [900, 1200, 1500, 1800, 2100, 2400],
};

const EXHIBITION_SIZES = {
  width: [300, 400, 500, 600, 800, 1000, 1200, 1500, 1800, 2000],
  depth: [50, 300, 400, 500, 600, 800, 1000],
  height: [400, 500, 750, 900, 1100, 1500, 1800, 2000, 2200],
};

/* ============================================================
   PRODUCT LIBRARY
   ============================================================ */
const PRODUCT_LIBRARY = [
  // === SPEEDRACK / HOMEDANT ===
  {
    id: 'sp_shelf',
    brand: 'SPEEDRACK',
    category: 'Shelf',
    name: 'Shelf',
    type: 'shelf',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [2, 3, 4, 5, 6, 7, 8],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [
      'additional shelf',
      'hanger bar',
      'caster',
      'pegboard',
      'side panel',
    ],
  },

  {
    id: 'sp_heavy',
    brand: 'SPEEDRACK',
    hidden: true, // old model, not rebuilt from the part files yet
    legacy: true,
    category: 'Heavy Duty Shelf',
    name: 'Heavy Duty Shelf',
    type: 'heavy',
    defaultSize: { width: 1200, depth: 600, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [3, 4, 5],
    defaultTier: 5,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'side panel'],
  },

  {
    id: 'sp_washer',
    brand: 'SPEEDRACK',
    hidden: true,
    legacy: true,
    category: 'Washing Machine Shelf',
    name: 'Washer / Dryer Shelf',
    type: 'frame_open',
    defaultSize: { width: 700, depth: 600, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [1, 2, 3],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'hanger bar'],
  },

  {
    id: 'sp_slim',
    brand: 'SPEEDRACK',
    category: 'Slim Shelf',
    name: 'Slim Shelf',
    type: 'shelf',
    defaultSize: { width: 300, depth: 300, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [2, 3, 4, 5, 6, 7, 8],
    defaultTier: 5,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf'],
  },

  {
    id: 'sp_open',
    brand: 'SPEEDRACK',
    category: 'Open Base Shelf',
    name: 'Open Base Shelf',
    type: 'open_base',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [3, 4, 5],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'hanger bar'],
  },

  {
    id: 'sp_garment',
    brand: 'SPEEDRACK',
    category: 'Garment Rack',
    name: 'Garment Rack',
    type: 'garment',
    defaultSize: { width: 900, depth: 500, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [1, 2, 3],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'hanger bar'],
  },

  {
    id: 'sp_rolling',
    brand: 'SPEEDRACK',
    category: 'Rolling Shelf',
    name: 'Rolling Shelf',
    type: 'rolling',
    defaultSize: { width: 600, depth: 400, height: 900 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [2, 3, 4, 5, 6, 7, 8],
    defaultTier: 3,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'handle'],
  },

  // === MAX 200 (light rack) ===
  {
    id: 'lr_shelf',
    brand: 'SPEEDRACK',
    category: 'MAX 200',
    name: 'MAX 200 Shelf',
    type: 'shelf',
    defaultSize: { width: 900, depth: 450, height: 1800 },
    sizeOptions: LR_SIZES,
    tierOptions: [2, 3, 4, 5, 6],
    defaultTier: 5,
    frameColors: ['white', 'black'],
    boardColors: ['steel'],
    addOns: [],
  },
  {
    id: 'lr_rolling',
    brand: 'SPEEDRACK',
    category: 'MAX 200',
    name: 'MAX 200 Rolling Shelf',
    type: 'rolling',
    defaultSize: { width: 900, depth: 450, height: 1800 },
    sizeOptions: LR_SIZES,
    tierOptions: [2, 3, 4, 5, 6],
    defaultTier: 5,
    frameColors: ['white', 'black'],
    boardColors: ['steel'],
    addOns: [],
  },
  // === HOMEDANT HOUSE ===
  {
    id: 'hh_shelf',
    brand: 'HOMEDANT HOUSE',
    category: 'Shelf',
    name: 'House Shelf',
    type: 'shelf',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [2, 3, 4, 5, 6, 7, 8],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['drawer', 'hanger bar', 'curtain', 'pegboard'],
  },

  {
    id: 'hh_garment',
    brand: 'HOMEDANT HOUSE',
    category: 'Garment Rack',
    name: 'House Garment Rack',
    type: 'garment',
    defaultSize: { width: 900, depth: 500, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [1, 2, 3],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['hanger bar', 'curtain'],
  },

  {
    id: 'hh_slim',
    brand: 'HOMEDANT HOUSE',
    category: 'Slim Shelf',
    name: 'House Slim Shelf',
    type: 'shelf',
    defaultSize: { width: 300, depth: 300, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [2, 3, 4, 5, 6, 7, 8],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'hh_open',
    brand: 'HOMEDANT HOUSE',
    category: 'Open Base Shelf',
    name: 'House Open Base Shelf',
    type: 'open_base',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    // counts the open space as a level: 2 = one board, 4 = three boards
    tierOptions: [2, 3, 4],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['hanger bar'],
  },

  {
    id: 'hh_drawer',
    brand: 'HOMEDANT HOUSE',
    category: 'Drawer Shelf',
    name: 'House Drawer Shelf',
    type: 'drawer',
    defaultSize: { width: 800, depth: 500, height: 2100 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [2],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['drawer'],
  },

  {
    id: 'hh_cabinet',
    brand: 'HOMEDANT HOUSE',
    category: 'Cabinet Shelf',
    name: 'House Cabinet Shelf',
    type: 'cabinet',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [3, 4],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['cabinet', 'drawer'],
  },

  {
    id: 'hh_rolling',
    brand: 'HOMEDANT HOUSE',
    category: 'Rolling Shelf',
    name: 'House Rolling Shelf',
    type: 'rolling',
    defaultSize: { width: 600, depth: 400, height: 900 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [2, 3, 4, 5, 6, 7, 8],
    defaultTier: 3,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'hh_pegboard',
    brand: 'HOMEDANT HOUSE',
    category: 'Pegboard Shelf',
    name: 'House Pegboard Shelf',
    type: 'pegboard',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_PERF_SIZES,
    tierOptions: [3, 4, 5, 6, 7, 8],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'hh_trolley',
    brand: 'HOMEDANT HOUSE',
    category: 'Trolley',
    name: 'House Trolley',
    type: 'trolley',
    defaultSize: { width: 600, depth: 300, height: 900 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [3, 4],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'hh_perf_trolley',
    brand: 'HOMEDANT HOUSE',
    category: 'Perforated Trolley',
    name: 'House Perforated Trolley',
    type: 'trolley',
    perforated: true,
    defaultSize: { width: 600, depth: 300, height: 900 },
    sizeOptions: HOMEDANT_PERF_SIZES,
    tierOptions: [3, 4],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  // === EXHIBITION ITEMS ===
  {
    id: 'ex_banner',
    brand: 'Exhibition',
    category: 'Banner Stand',
    name: 'Banner Stand',
    type: 'banner',
    defaultSize: { width: 800, depth: 400, height: 2000 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['white'],
    addOns: [],
  },

  {
    id: 'ex_poster',
    brand: 'Exhibition',
    category: 'Poster Panel',
    name: 'Poster Panel',
    type: 'poster',
    defaultSize: { width: 1000, depth: 50, height: 1800 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['white'],
    addOns: [],
  },

  {
    id: 'ex_table',
    brand: 'Exhibition',
    category: 'Counseling Table',
    name: 'Counseling Table',
    type: 'table',
    defaultSize: { width: 1500, depth: 800, height: 750 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'ex_logo_table',
    brand: 'Exhibition',
    category: 'Logo Table',
    name: 'Logo Table',
    type: 'logo_table',
    defaultSize: { width: 1500, depth: 600, height: 750 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['white'],
    boardColors: ['white'],
    addOns: [],
  },

  {
    id: 'ex_chair',
    brand: 'Exhibition',
    category: 'Chair',
    name: 'Chair',
    type: 'chair',
    defaultSize: { width: 500, depth: 500, height: 900 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['black', 'white'],
    addOns: [],
  },

  {
    id: 'ex_staff',
    brand: 'Exhibition',
    category: 'Booth Staff',
    name: 'Booth Staff',
    type: 'staff',
    defaultSize: { width: 500, depth: 300, height: 1750 },
    sizeOptions: { width: [500], depth: [300], height: [1600, 1650, 1700, 1750, 1800, 1850] },
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['navy'],
    boardColors: ['none'],
    addOns: [],
  },

  {
    id: 'ex_staff_lee',
    brand: 'Exhibition',
    category: 'Booth Staff',
    name: 'Manager Lee',
    type: 'staff',
    preset: 'coat',
    defaultSize: { width: 500, depth: 300, height: 1750 },
    sizeOptions: { width: [500], depth: [300], height: [1600, 1650, 1700, 1750, 1800, 1850] },
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['navy'],
    boardColors: ['none'],
    addOns: [],
  },

  {
    id: 'ex_catalog',
    brand: 'Exhibition',
    category: 'Catalog Stand',
    name: 'Catalog Stand',
    type: 'catalog',
    defaultSize: { width: 400, depth: 400, height: 1500 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'ex_sample',
    brand: 'Exhibition',
    category: 'Sample Display Table',
    name: 'Sample Display Table',
    type: 'table',
    defaultSize: { width: 1200, depth: 600, height: 900 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'ex_tv',
    brand: 'Exhibition',
    category: 'TV Stand',
    name: 'TV Stand',
    type: 'tv',
    defaultSize: { width: 1500, depth: 500, height: 2000 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['black'],
    addOns: [],
  },
];

/* ============================================================
   HOMEDANT LOGO  ── embedded data URL (works offline, no CDN)
   ============================================================ */
const HOMEDANT_LOGO_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwMDAgQDAwMEBAQFBgoGBgUFBgwICQcKDgwPDg4MDQ0PERYTDxAVEQ0NExoTFRcYGRkZDxIbHRsYHRYYGRj/2wBDAQQEBAYFBgsGBgsYEA0QGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCABgANADASIAAhEBAxEB/8QAHQABAAIDAQEBAQAAAAAAAAAAAAUHAwYIBAECCf/EAEoQAAEDAwMCAwMGBwsNAAAAAAECAwQABQYHERIIIRMxQRQiUQkVMmFxgRYXGCNScpMkODlCVGKDkaG00SUmVldYY3OClLXS09T/xAAZAQEBAQEBAQAAAAAAAAAAAAAAAQMEAgX/xAAgEQEBAAMBAAICAwAAAAAAAAAAAQIDBBEhMQWxElGR/9oADAMBAAIRAxEAPwDv6lKUClKUClKUClKUClKUClKUClKUClKUClKUClKUClKUClKUClKUClKUClKxl9hL4YU82HFdwgqG5+6gyUr4pSUoKlEBIG5JOwFflp5p9vmy4hxPlyQoEf2UH7pUbcMgsVpfSzdL1b4LihySiTJQ0SPiAoivcy+zJjofjuodaWOSVoUFJUPiCPOgyUrCJcVUoxkyWS8PNsLHIfd51mJAG5OwoFKwNTYbza1symHEoG6lJcBCft2Pavz84Qf5ZH/ap/xoslv09NKwInQ3FhCJTClE7ABwEn+2sbt0trDymnrhFbcSdlJW8kEfaCaFln29dKxsyGJLQdjvNuoPbk2oKH9YrJRClY/aGPaPZ/Gb8X9DkOXx8vOslApXnZnQ5D6mWJbDriPpIQ4FEd9u4B7VleeZjsl191DTY81rUEgfeaD90rB7bD9mTI9qZ8JR2S54g4n7DvtX5+cYH8tjftU/40HppWFqXFfXwZksuK232QsE/wBlZqBSlKBSlKBXH2oiuPyrunm52HzUjzP+7mV2DXCnUZhEfUj5QvFMIlXKTbWrnZWm1S4yQpxvj7U5uAe3fht99FjrnVZxB0FzUBad/mCd6j+TrrkDSrVOXpL8mnMyS1KQLxJvci329Tg5JbecI/OEHz4JStW3kSkb1J5h0PWPGtOr9kbepWQyV223SJqWHGGwlwttKWEnY+R47VUU60TLj8mBa7hGQpTULMXnH9vJKXG1NhR+rktI++ixb2lXR1a9SNP4uoOr+S5DMvl+aE5CGn082kODkhTi3EqK1lJCiOwG+23avDhD2VdK3VzbNK59/k3TBslU2mL7Qdg34qi226E+SHEuAIWE7BSVA7b7bda6Q5DbMo0JxK92p5tyM9ao6fcP0FobCFoPwKVJUkj6q5V6o32cu63dLsMsjgfuUJ2P7SG+5ZLkpDoCvgQ20Vn4Ag0RUuoWZP6efKMXvNmeYbtmQtuSeP8AGYU0hDqT9qFLrtXqY1CbwnpZv95t8tIlXNhNtt7qDvyXIHHkk/U2Vr3/AJtcrZTgqtQeovqNsbDAemx7cLlDG258ZhxlwAfWpIWj/mqAh5nO6hGdDtGSt9wW5ZReF7H30Nq4pX9e0VtR3+LlFb30PY5GybANV8XmuPxo9wZiQ3FtABxCVtvpJG4I3APqKtz8i/Av9Ksm/rY/9daN0642rJ771HYpBuLtmM+5rhMy44PKKFOSkpUkAg7pG22xHl517/yKMo/2h8n/AGL3/wBNZbNOGy+5T138n5Tq45cefZcZVhYn0pYZiGc2rKYORX9+TbZCZLbT5a4LUAeytkA7d/Q1zJkGmNo1c+UnzDCrzOlwYr7rshT8MILgLcZkge+CNjv8KvnBuk3IcO1JsmVSdcMgu7Nslpkrt77ToRIAB9xRL6hsd/gar7Bv4XTKP1Zf91Zq69WOueYzxn19/R2ZTPoz/lZPEBqPo9nnSa5B1M0uza4TrMiShidEljiByPupeQj3HGlH3d9gpJI2+I7RxPUKyZTotbtSQ4ItrlW35yeKzv4CQgqcST/NKVA/ZVU9aGTWmy9Kt2s855oTb0+xEhsqI5KUl1Dq1gfBKUEk+m4+IqlM1yi46d/Jj4RhBDrd7yxosoj9w4Irjqn17D+clbSP6WtHH9qaXl2cr1MPVSIrvzYMt8Ee8d9vD5hj9XwPzf29q/qTa7lCvNhhXe2vpfhzGW5LDqfJba0hSSPtBFUY3oCx+Ql+KEst/Oqrb7UXNhv85b+Py3/4vub/AKPaofopz5zJtAl4jcVqF0xaSYK2l/TEdRKmt/1T4jf9HQrjKyZtkWmPVBf9QsfivPtWq+yk3Btse47HdlLQppZ9AvbZJPksJNdr9TuSWfMegq7ZRYZSZdsuLcGTHdHqlUprsR6EdwR6EEelUZ024rZs46htasSyCN7RbblGlx30eRANwVspJ9FJICgfQgGtByW/ZHpJpjqP015kp15r2hibZZIT7itpDbiiPgh1scx+itKx5miuhNLtGbPrX0C4Bjl4vFwtbMOXJmpdgpQVKUH5COJ5gjbZZP3VQOq/T5YdPepfB9M4ORXaXByIxvHlyEth1nxZJZPAJASdgNxuPOuyekT95xh36sr+9O1S/Uz/AAg2j32wP+4KoSrb0b6WMZ0a1Ddy20ZTernIchOQixNS0EBK1IUVe4kHf3B/WavylKPJSlKBSlKBVG5Pojf751oYvrJHvFtatVohCM7CcSvx3FBL6d0kDjt+eT5n0NXlSgg8zskjJdNsgxyK82y/crbIhNuug8EKcaUgFW3fYFXfaqs0e0FThnTPO0lz5+3XyNPfkqk+yBaW1Nu8dgOQBCgU7gjyIBHlV31oWrSbi3g7My03652mWmfDjNrgupRz8eU0yQoKSoHYLO310HOTHSjrfgM6ZC0d1uNtsMpwuezTFusrST6kIStClbduaQknarG0M6YYmmOVSc8y7I3MqzKSlY9ucSoNxyv6aklZKlrUOxWo77bgAbneQZ1BvOCXXIpNxU/e8fj3iRAQ5JmKcmIMe1pkHiniEcSplwHuDuvl6HeVvGcZpM0ayCeqzSLJc234sWDIaBa8f2hxpH5vxkghSS4UciOJICh8AV4cB0WvuKdVme6pzrtbZFsyRkNR4jKV+M17zZ9/ccdvcPl8a13RXpf/ABU6/ZLnj1zgS4EgPNWWK0hYciNuu81cyRtuEhKBt6b1J43qplsaXJxxmzXC/wBwhTXlSGXfzzzDAf8ACSyHmk8HFgBa/EVskdkHdQJE+dQ8tuOeWywQ2rVa3/n9yFLhykOLdMRMZ91C+W3E+IlpK0qQSO/E9wqg1vTvQvM8Ed1clMZRbmpuYyXJNrkxPESqEoqeUlSyR5jxU/R38jUD+JXqU/17q/bP/wDjW6X/ACnInbVlmTQsmkQrhZr181WyyNJbLT60qbShp1BTzWt8rJBBHFK0FO2xJyTNYcibi3aTGs1jS1CjXO5NmROWnxYsKQuP5hHZxxSQRtuEjzJKgKy2acdl9vv+vocf5PdyY3HXMb7/AHjL+4gsQ0m17s+e2i6ZFrGq6WmNJS5Lgl14+O2Ad0bEbd+3nWiZ50rarXjqJyDU7B9Sbbjj1xfK2HGvHbkNILSEKSVIG3fh6fVVsT9arlEemey2aHOQLc5IjKS440lUhqRHjuMlak+8PFkFPJIIBQR7x32+y9T70xfZEa4iBAkWn5xTIW0847GfLRhBvZsIDi1q9sCAhJB5jYcuQ2uvXNc8jPs7tnXlM9kk8+PiSfpVeM9Gd4vGdxsn1w1Kl5mqMQRBBdUl4A7hDjrqioN7+aEgb/GpXXvpu1J1Y1dt2T4/mNistus8Vpi1x1tveJHUlXNTnujiDz47beQQmt7hai53+EhtEqzW1i9yC2y7FkTVmLBUmEuUv6KCoqAWyhWxI3O4Ow7+m1axXe+GyT4VitzECdcIFreZkTFe0pekRm5K1ISE7KQhDmw32KtirsB30cfyp38nvqw3/fIu/wDUyv8ACp7QPpx1N0k1nm5he81sl4h3Vh1q5tNIeDr61K8RLu6htyC9ySfRaqsLJM2u2FaiXSbkEidLjOtLXYo0SUyiE4lIabU1JHHm04lxwqLpJTxPmCOBi8g1PyKBliESm4iX7C5LblNwpa/Y5qiiElvckAjgZoCgd9lJ3379gj9DunvI9LNccyze7X+1zol9DwZjxW3EuNc5JeHIqGx7Hbt617OpPp0a1vtlqn2e4Q7TkVuWW0zJLalNvRld1NL49+ytlJPoSofxqkMh1SyM5ZcGbQq2tWi1t3gyffKnZCYceMrdC9iEKDkhSfX6Pf4Vimaz3mx4oLqqzwpsZsyba207OPtjkqNHUtbjqQjZLZW2UE+Y5oXtsriA2/RHT+46XaFWLBrrPizpduDwckRUqS2vm8twbBXfyWB91V/q3oJkmoXU5gupdsvVqi27HvZvaI0kOeM74UkvHhxBT3B2G586tnEMhu14n3+2XuDDjzLRPTEUuE6pxp1K2G30kFSQQQHQkjbzG489htFEKUpQKUpQKUpQKUpQKwyYkWY0huZGZkIQ4h1KXUBQStCgpKgD6hQBB9CAazUoPAbJZisrNpglRdXI38BO/iLSULX5fSUklJPmQSD2rzN4nizWPO2BrG7Si1Oq5uQExGwwtW4IJRtxJ3Sk77eg+FTFKCH/AATxb9wf5t2n/JxKoX7jb/cpJ5Hw+3ud9j227jevrGKYvGbbbj45aWkNyvbkJbiNpCJHf88Nh2X3I5effzqXpQRq8esDuQIvrlkty7ogcUzlRkF9I22ADm3LyJHn6mteyvTWwZZb41sloRFtzIcSYsaJH2UHDu5xWpsraKu4JbKSQo999iNzpQQ6cSxZEyRMTjVoEiQrk88IbfN08kr3Urbc+8hCu/qlJ8wK+TsRxW5hfzjjVol83C6rx4ba+SyUqKjuPPdCDv57pSfQVM0oIqJjGNwEoEGwWyMEApR4UVCeIKQg7bD1SlKT9QA8hUErTawLzqDkqkoSq3lBiRWYkdpDRQ0WkDmhsOKSlKlcUFRSCry7DbcqUESjFsZRNny0Y9akyLghSJroiN8pKVeYcO26wfUHfeviMVxhu2C3N45aUwwy5HEcRG/D8JwguI47bcVFKSoeRIG++1S9KCF/A/EvZmo/4L2bwWS4W2/Ym+KPERwc2HHYck+6r4jsayOYtjLs+VNdx61Lky0BqQ8qI2VvIG2yVq23UPdT2P6I+AqWpQYWYkWM6+7HjMsrkOeK8ptASXV8QnkojzPFKRufQAelZqUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoP//Z';

/* ============================================================
   RENDER IMAGE MANIFEST
   --------------------------------------------------------------
   Reference rendering images for each product. Used ONLY for:
     1) Product Library thumbnails (left panel)
     2) Property Panel preview (right panel)
   These images do NOT affect Three.js geometry, collision, or
   placement. The 3D model is always built from current settings.

   To register your real image files:
   ───────────────────────────────────────────────────────────
     A) Drop them under   /assets/renderings/<filename>.png
     B) Either add hand-written entries to RENDER_IMAGE_MANIFEST
        below, OR call `registerRenderImagesByFilename([...])`
        with the bare filenames and the parser will fill in
        brand / type / W / D / H / tier / color automatically.

   Filename parsing recognizes:
     SPEEDRACK | HOMEDANT_HOUSE | HOMEDANTHOUSE  ── brand
     shelf | heavy | washer | rolling | garment | pegboard
       | drawer | cabinet | open  ── type
     <W>x<D>x<H>   or   <W>_<D>_<H>     ── dimensions in mm
     <N>tier  or  <N>T  or  <N>-tier    ── tier count
     black | white | gray | grey        ── color

   Examples that parse cleanly:
     SPEEDRACK_shelf_1200x400x1800_5tier_black.png
     HOMEDANT_HOUSE_shelf_900x450x1800_4T_white.png
     speedrack-heavy-1200_600_2100-5tier-black.jpg
   ============================================================ */
/* Auto-populated from /renderings_small/ at build time.
   8 SPEEDRACK isometric views, resized to ~320px tall, embedded as
   base64 WebP. Total inline weight ~170 KB.
   To add more images: drop the file in, run the build helper, or
   call registerRenderImagesByFilename([...]) below.               */
const RENDER_IMAGE_MANIFEST = [
  {
    fileName: '스피드랙_1200x400x1500_3단_B_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1500,
    tier: 3,
    color: 'black',
    boardColor: 'white',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1800_3단_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1800,
    tier: 3,
    color: 'black',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1800_3단_W_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1800,
    tier: 3,
    color: 'white',
    boardColor: 'wood',
    url: 'data:image/webp;base64,UklGRto6AABXRUJQVlA4WAoAAAAQAAAAqAAAPwEAQUxQSBkiAAABoMf//zql+V3YHdt0nc7aTJzd3Ypi6xS7FcxhF0hKmMQs7MYAJW3swtliId1c/X7f9+Nx97vj7vO9298RYQuS5LCNpWIE4qHZwNESwRlANnT7K5R+KBRKpUptPFRKy5dTqW6jTlO2HEx4cjl0YfvvyppdjVJ2fQrBgQ6F8WVRqax4VSrWqd9u0BSPwIOx99/m6GDhyH8eG7rMxenrMubdyZrae3emH01ZyqtSuW7DDs4zVm09lvTkUxEsH5IoSpLRB7Oj5HVi+HKXVpa7U9t9d4rKXzfq6DxjzTYrXhVJNBgPUZIYg4WDma5GNL+QwpfxYcuGt6yrtvP3dY7//tjYxKdpxda/KlYcNnT3Im7XEucWdey2O31pr4ooSsy6V4Wyu4Lnl3Yudm7+lcruuvts0IuiaO1bxr27HYuGNP9KaT/d+UGE5cPuusv/7+J29yHNvrSH7twsYJ/dwUJ3MdvcBjX9gmt3Sy3gEN3lPb2wdeHAJrUVXLpbYgFH6i435ULIggF/ltodIQ7YXc6T88Hz+/9RSzA7VDZ2t9gIkw075sDdnQuc26+x7d0thoUnuOmqJQaH7S77UVTgnL6Nalrf3SLAMGbY6v03P5u1leRNHbq7gNl9GtYopTvT/8o/uUe0v5uupEqDvgt2xL3RAADM7kJH7i7r4Wn/Wb0bVLeQBKk8CregqbqsyuzNLftDx8k+Z57kOexdCFZKdyzzwWm/mT3//LWKqfIZTQVjAFCY0nTzQPBli5GrIpNLvQsdsDsJZofh0+1gd8CE/K01a2qex1Rt0G/hjvg3Wgt3IZMAh+0ubZGYo20uKK2YBqnV5ndhuR86TfY9k5JvIbuTHO5tBZgkpXhkrpUsFZa7K+0uVHzZcuSad4/0cNC7UMK8xewSrMWquzChVSqyT6VcTLV0FxokxhwDFzdoYKyQTDuNTe/e1aLggYdQ6cfOU3yjUvId6JkkYcwCQGohg0IQ7kKChHVmk1DFV06j1hy8ne4Qd6GE0UsKorVkCKqopldwf+Z6oYzlZ1K1hv3ddyW8LeUuJBmX5IxaVuiJZmQoo798gBTnjYLa/C609Ewq/2OXaX5nnxbQ3YU6uo5MccfEQqSiORnCrVXZyDzkKaitfyYp6ziNXnPodobNdyEjeWxbnEcBBoxcAIBUBoC1lrEyQlVvNNA9NDFVR34XSqW/LmL2i6tHg903AEZYia4lGYrLu17jY/x66xCsugt/6jrN/5xVd6EmD8gsLOW2shinAW36k/hI73nD2v1WU/YTttBdY6OWZnuKLQQVleWEIhG3OlmLLXdhqzFrD9/JtHQXStoC4FMBk71tFl+X4g/3L4SvmzbA6ceqFn8EVTl1r7xf9WPdpVNoToZwved7vF/lZQ5pU6F644GLwpLeWRi7oqWVvjc3T25d/nfPJt9UtPi8UKnNJ5wqoQvmYsR8FKElFQrh9ks9NB9KKagilPnPVeHnrjMCnoiiETEz6bC/+6jODb40rZ1aXj4tZUJsohP7DJe5AHOi4w7TQY91pUL/ti4EAMDT0m0lf9ssTyhLA4CLW/F1bSs6+fTPCbg73kLBqWl59Zr4Z8Cda77Kcmqa9QSV0K1kjzRiccFa0FkUF797jGejjIGG70Kw4NN9PdC9yw4Ll287PQt+EUfNw3M40Vlu++Ug+/Rm7gQsiwRmLfiXkK7YiOFzIRGi3gNIwALubLySAkTFbCOkCyvBsDkQ9X8RVtY/xbuja7mzTG7ZSEhnAM7uuVsMdBblKWUS7nbewJ01Jx8ACed9KeX8lZLLAjGSUr4x6AM+buQv+3bbAHTpSmnpVdRQcpmD/A9kFYVwK1OELpd/EeBxGJizOIKQ7ojA0FnAs9Z0JOcVQmNYz99y6wUQkxRM2gwYOlf7GK3p5JNfxuKOM/9iudyygZBuJhYWrGJ0FkXsryl4OcGTO+v2JANnjlBa+uSMY8Nm4yEI5eTQPOTG8MevxyagU/ftlGhaM+dZzABC+TYAgL+8ZdVxYP7ycEJ64AIGzwQMbegql+bdx6vQjdzZ8PAtkHRrC2kzYPD8/F2UnC57BQ+68rf8I7espyxYEQbPNYRSyjdGf0Kanzd31gcnAZHhlJb+WV3Z0BnIQRtCi47BoOVf+PfyAjr2prT01ffDoOkA2hIWr3NQmMOfwHWnAbdVYZShm93FwJn6N9p2dPKJKhdxpy9/Njz/ANx85E/aDBg4r2Al6CxCwh/P8GaaF3c85JZ1lIXhFQbOQDJl5eaxAuRf9eTOpk0Xge1b/AgZmNmEDZ7G9GhHmLUBAOwga+vjA3TsT2npZ5iIAVMBQ3s6OXrUTTz33sSdoI3ngMXrQylDN0tF/9mFkXpCzlS6jsc9+UfE9e/SgQcvfChlAP1n6oNI5WlpSN/qzZ0VcstayoomzlTJQHvCQANAAv/Cc1kUsHkDpWVwdj02YApAydWbach9y58tA/yBzoO3UYZucTn6ThPTdR3p5OPlYnC3O/9mW32jgWV+YZShm+Wj76zC1YywSGz1Au/mbebOkle5jL24v4KyGYC+U5EIQm7EFaHwvhd33BgYQ/5CykBTsAv9JkOHDrQWZgcWn3nHAI9VAYQMzamPfq6ASCif634ZKcv4B5rAIUFAV5etlIUUgt7TS07rO9ElQ2drJONpPzuIiP6xwAr/HZTNIKL3NJ03ZeWGezoyI3z4R8T8fCA1cxNloAHQ2xWf0JEwItqJvBoAgNWUcvZS9JkEoBMdSafeIvO+J3e8Jx4A5s3zI2RYfnNjIeXrOtPJx9UxuGcHy53Bw7cBPcZSWgZJJ9BzWtF6Rlhc7vwKHxZ787cEJwJrQrZRNgPQ0xXnQcj1+yUoee7F36ItBtIL1xPTYyI06ExpMUAE/47WGiRqi0v6CNbrb0DqQiefaR6HxzP54+uyG5g01Z+Q4UVd0d1VE68j5EKdO3gxhH+zkNG7gN6ulJYh0g10c9VtoKzcWJeB7EM+/C07rwIbd4VQNgPQfQJS0YUQALADeT10QJ5+LWmRbYJREr/jP6TF8m+2rkALGLSUllFpHY0wrb4bYaBRXcSDjvxDt/+AUMBlvB8hI0pGoqtrsbfUlbCj/m+QttqX/xRoQgTQbwal7MxeocsEHCesKM480zPd+3X8LbuTAZ89QZQygK7jUAy6ijIyV8sM4lI7sIiABqsokyHdY3QZCzBC+dyv0Xg4zos/nwqBglw6i1oYm9YEXSfoknXd6eTon+7j9Uj+gSag5w6g/0g/QkZqF6LT37o16EaYDIVkIfeMD3e2ue4DBs0LIWQYy0bnsXihpwQAwL8IOnAXCDwUQIgzgE5jwO53oePSqvt4d8gOZABgWEFZKYxC5zEQDT3pLCfLxuJxJ/6BZuPzbODzx1WEjE9rhE4TSgJFQstVl1Skb+IfaAI7bwW6DaO0jNL5osNYth+EXMsXoS/gX9kx7SAwdFEQIS7Qo+NoFKEHYZGehxLNZv7FiUfAjpOUxXAAHUYBrAedfOKLc3gwiH96uQEAgH8oA012AOs4xvBE14uuiG30CKkT+Reet9OAl88oLX9nNEX7cbpV6EkoR+aiIM4OZhYdgoH2Qygrow2H0G4UHpMCALADy+yjgMtySssIAO1HQqRDEKKn3sDrEP4Enn8K7I72pgw0ANqNAAy96ThVKQFPu9qNZRml/HkOaz9GGyoSWq5OfofMLX7c8Yp9C9y9vZqQiVkd0XYUCwMhVwCIIv9KcLsgoNVgX0LGiJfRZgTy0ZtwufPRZ+SneXNn1/yTwOjVgZShG0BbFwB9CGe/laPwsOcm/paEl8ChRE/KjqBD2xHiG30fuiLOKQUfZvjwz9rklqWEuH4YjDajdKsoK1ej81GUzB/vY8+A+HhKy6Q8Z/zlgtt0KIWrABj4h+6QtkFA86GUlnHSM/w1HAYQVs4OSMDzNfzZ5X4WGLdhC2UzAK2HAWJfwnXZGlfwvBf/udqW5LfAmZsbKAv9B7Qeqdsv9iWU3T4iexf/QLNJbllMyNTUdkZZCkFfOvkyAMkOZJ/QB8CJk5QW18LZcBqGHBAW8dFvkP3EDtYT2gcDTYb5UE4qWTZaOQPoRycfKxeFR503cSd8+QVgog+lZSyAVsOkNH1/uiKh8zOkufnyl299Yoi9sYIyGSq6xlq56FajH6F8pxgl//FGJSwGmIScKYTMSG2Gls64SskViBDBXw7wuwmEH1hLyOQSL7QYCgP608mnW0fjv7le3NnecRvQZIQ3IROgY05DAGkA4bps3Rt4PZA/oStigSn+fpTNANZymP6kOIAw0KxLQ26kP//Ky3Tg2vNVhEzJ2cdaOkv+GEAbaBj4J+yeAAC4EzLrXQs0H4JMEBaXwlPwOZG/xd8jCfALWUNZaCPRfDCAgYS/wVb2HJ504J8M7ei6E2g6jtIyEWAthrBcwyDbUSjlf2GcMOAlMlb4COXVSgVPwtYmAjOCfSmn6YDUwlm/npkXNv/JtqJm8msNtB+2mv2Nq0rBrfIxG7j/3oMy0KStZs0HIQ7Gwsb+hBqN+s7ZEvUoWwIAaB6ET2lWUXZ1pm3vOLBZbnEjZPbHjmg6CHoT1vfXsM/sgDMPsyztWAAwAMC7KI/uX8ljsfEtpU7YZ18EVnhRWqbqk1jTgYA0WFBZ1d8sWX9W7XzAJIMBAJB3PXB0/TJm95+ScgrUKwxo5rqZclIJSM2G6GPEoepyFvqr3qD3LP/TD7Ng82YHkmiQAEB8fmhBuxpmb6lSQWTZdBWYu5OymSsgNhssbUZPeX+9ZvqdepDJLPZn+8aCotm2QBlxnoN+sDC0CSw5+cDzzGWEzHn7N2s6AJ+xfqq/Nf2R7rrELAztShRDWy1401vmpg/FnwMBEPVH9Ja+i/LoWdfWoa0WAsdHAbNXrKW0iM+lJgMgce0PAFDq0M6/EWTb0FYLof13A04zvSjzYEA0wnOTGMKhXarF9ybg9q8XaZEtNunPCaqhHe85+EcLQ9uiRVMMfChcTMj8V73ZH+RwGNoPSx/aasFHZACwkNKSNQuN6eA+tHtYGNplhOAhx4Fx7pSW6VK2+Ec/27GfoX0zeEwD+dCOGBoJtJ5PKgMGE9b+h10ObemFcWh/IYSE3AGWR24iZGbJY4NcZpZ2fnGA+y8z+oFBD2Rr3ZTlVQoi3F+0RaNeRkoAa07Z99AGwOBmIUG1nXl5nmi4Ajr4Oi05/cFhToHJfzSJZUSt6FGHJEFVCzOg1zcOhhYBpl2jWy888Q4AYDrlOEf+DQtD27SVqPXNAH2jECOBqvKyEFvRae6RN/JTBkfY445ZGNpHFra3lKBaV8k+Y5BjvAiFSp6tl28+8+BLW07Zd/T8yUKCWiqLX7RG/UA5ZtMf+alyTabvey47J5Z+yt6jZ8S0FpYSVIuhu+iAVN/fiNkn9qWcKtPYdfdTycIpB3pL359bWWqCqhZmAbqGwZaw4pSqwd9hjw2lnHKY6BlkcWgbA42JICNmG4BYeUr5+7idD/VmpwDAgaLn4YUdasoK9aJP/oYGWyzJNpwSfh219a7WfJoOwIGiZ4LXkJ+MWdurLqgXgBLMl0d760/JL+onl6DbWrMXmwEONLS1j3ee0lwVf/8bwHB5WkJxKikwA4wBkAwic6y3FJr63Q0XpVE0+ZNSVVaIfasFw6OEQjjUKckgMUlbvxfzhRGqBeS4ogJodF7Cd/09L+c51ilo6/dABkZSoRCOf38C/7n4yOJ8nT4bEnIc5hSD5vceAB1K4ULDW/g0xkcoo1LLYsAXPVZfyjRL95j9w4oNhJWEvZkojJZ/JqlQybffq9V1RXS6eW5qz9TrafBmowllAIDZpzEWT9XotPxcmvkpu6U7LmI0nXxuwRW8Czf7YKrUU1XbLabN+hk5v3WHnpITlS/gZSdP+cK4VaeqtHazv6yfMVl+U/JbN0AirCROfoVc88/NrT5VqdW8o29tTaQlA1g2UVuzOGPk1x7iFZGQWAaIOht+cd9C1l+h+ayDr2w5xYzk2hYJLbUFS7ux6xyYpn43thlj6bj0LA2F2Wa/iWDzqXJNp+9/DmtzUwYYbEkxRciPzzf2LB3UsIogzIGOjeuKNIyhk4/WOoanvb2s/9zOmqz/jyl7/rMi66dom5G8b/ngxmb7yZZR74UO07oCdCiFmFb3kD7F7ONoslOqhhPDn1jI+m1vm3k70mPoH9Ut3RRKhUo4bWR2V6YTCStxF3JRfMOGX0KhyvoZSoqBNI08h7TQNuvuwZXDmpTSVn4NKuGUiW5iABtHaAEgwQzyU4rfRm+7p5UPUR2QY7CQTufcO7zapWlNa9paZmoXnMU4Ovn08Bi83uBn3e8/UCXSPxuz/hKAgRkAIPfBkbUjm9cyfyWsXVaSVyZ2gR5j6ThV+xLedt8sh9+pH45ABCScHO30hTVtrWdWZ4CykrjoLfK3B1pbIbp00zMzHAbAgDmltrWFM0ZmdBFvi4RclMkBcjieegQJEBGrVpfy2a2txYzOzBMTCDu69BI5/wXyRrgn56KgFKg4Cy0mdcJ7jKeTj1Q6hmedjYHGsVAL+wFxSCcwOpRCfPdHyFoQYA+FRMxaTWrRd50giYScTi6CNsWfO/fpi3UPeuP7zmIII5MVih2iJDGsFFTcYRGZjJQ1n/2k7zrgJP6mk890OI2X8/zsgY86CTGELIVY+ENH6EFXCKe/S8SHAd52gASIpCwBCn7oALAJhBav9yiIDLIHCzMSTciKnMTi7ztKj8W/CZ/fABgCuSPbh18vxRPiea87vukgeWISHefD7iMjgTdK4QwAAKGCim53otzjhm/bI7WAMGs7WvEEXrTnHWjUQkB8OvDwyQzCjzaXAQXftweejyRM2IekIGeFMQ/mTHizSOD3KatoyTdSYnAllD/qoE8L5E7k1DigZyAla99HaL7tIIZKhPJFXSG0COZOROx7IDx5ESGbH/RD3bY4Alc6+Vi9o3g+xoe7HCK3TCVkdfEtzTftoANhcbb+NaS58GfroVQg7to8Qv4B8r5tCzBC4iLSUBTFu6ISIpruB36auoKadtILcRJ1oAniLh+YlQT027aSkE3PV+q/bittwhQ6OcrjMj7ut4OObqQBhx+5EeL9ZDzqtMFLTCa0VDmDNx28+MtyyxRKi/5D0ddtwOBKmAxNeoY8zyDu8raQ58Dh8/MJWQHkftMGkCbTEa1jEIv582/zSOD7GZSWlUyf+3UbcS+bQkjqZxQVhvC3LLgODA6jxOf+JLHOXziAaYSz368O4Xk/b+5y+ONM4PwLyor3y2X4sjW0ICwuOCUjc5If92Kb3DKZ0sKK8+r+BVBWLp3NQskV/oFm+5pHwNZDCwhZBWTXbS2lSpQyAAkh3NnT6iDw3VwPyqxN8yGvzl+SJ6YTriKOu4BU7y3c5YNLbgEue/4hJCB5CPuiFZ5RWk7UvoB3XTdzJ+xNLnDl/WxKy/vthi/+AjCVMBlyf4mCrfzz4O1yiysha4DsOq0AaRphM5nM37Jj7i1g9a6FtGTV+Us8xKYTzn4vv0TeK/6BZl+7I8AP7pTypuzr+V85YS9m0smHqx3Eyy785YMr7wFjDy4jJOj6ANRyghaERUy3e8iZu4V7EZZZADzMmkk5V8s6X/KFE0DKnQJoH/Ov7KC3rAeyvnKS0iQyVEaLCBFbuVt2jr0KzPJ3I2QdkPllS2kzZtEVx7scx+uFAdzlyC4ngJ//oZR9UvcX1m6BJ5Sc+j4Wn/p687dsfAS4HltCSMjN4ajZkgEzCD/a9EpF4T7+clhxCfC6cBqlpfBxQW0j0gw6+RwABv7sZACASYRsADK+aCmeZLPoOLvnLjIv88/aQvvHASPWuROy0URz/Iu5dJXDlY/gdXv+geZArzNAvTVLCQl8sr6kZgumobRcdH6EvOVB3CuHA54Cs6IXE7L17gypegsGEFbOf9RC/5F/ZUOBgbHs/0ZTWvSZ2bVaiJkSJfpC6LCN/4ZYOSKAz+MpkyEgvXYzyQfz6CpHGx7Eq7F+nGWVENE5Gui+ahEhXkyfXqsZHlJaohomIWO4L3fLoYEXgEZeSwjZljxDW72ZBMyhq1z69xOKo7Zzrxzc8QJYFONGaUnZoKtmhM2my4O3ABKwnv/CB0SgBBMpLcZKzWaGc4ywcnxlAtIi/bmzK1UDFOS5UspAWs0mCMcCOo5VO4HUDj78La3OAk7u7oT4aj5k1GgqFVNaLk1OQYFnMHf5yPBYoNmWxYSEJo3SV20qAnMJcww9g1i8jb9l7xtgdeJ8SsvbfUVVmxryJELOpaahuJB/s3AwAJhAufABpNVoIvnDjTAZ+no/XvXz5W+5VwC8f09p8QE+1fiT3dPNo+PcX9eRPTGA/0p3k9NA/QWUlsDM65nVmujxwpWuEh2dBc0V/vLRMYlAq22LCImIH6Gv/Kek0ywktACQwF8+cPI94HNjDuVcLeNKbtU/DdEGwuf3iXFReL85iLscAQDAOMrnN/ChWmOEwZ0wIn4ZhY9dvbkTGpMF3E+ZTM0fYhEW0FUuLn2Ooq1b+a90Nz4JfD/fjZDtrw7kVPnDAErOyGT+lmMTrwHtwyjZnThJV/EPfZE0n46oxGfIe7mDvyU2Ddj5YCYhwUVvMqo0lgKxiE4+VGM/Xnf2sRfLGEL8gfdVG7E7dKiEC71uI29uIP/1hH0fgYvXp1B+yGGisR5wI8wxHhRAl7KdO/tMljoLKeWwu575lYywhYQyDDBgJ3f5+PRkoOvehYTsub5UU6GxPom5EybsnQ/j7fxA/sudNzOBg8+mUVoMhR8rN0AoltJx8qcYpNtB1vav3DKaMhkC3lVpaCiitMT4vUFxJH85zO81sD96KuWHHEz7vnIjHeBOx2kADDu4E/nnSaD2Ikp5b+K8ogqNtBrJjZDwm8hM2MHfMvce0PvgfMqI+DC4oHwDaSulfLjaAaS28+ZveZoLnE91pbQA7yrXl5KxlFAeeR8FHsHci91yyyhaUis30AGLCZOhDB0Mn/nLYUufAr6HKTvaXvT+Q6UGWrBFhJTkQYtd3DnY4gxQ+58FhByInlRcroHuurSEUG6wF29GBXCXjy9+BAw6Po+Qf19HZZevh134h7D4MwHZLv78Le8LgGvpEwkJAd5Wqq8rpLRcOPAJmnM77MUykpY3FetrgSXEgcYO5HDX+8Ci0OmUWVvatU8V6mv00mLC2e+yGKTt2cadw63PAV+unU/I4XOuxWXqiTvhQceRWkfxsYMx0HDmxMqngMuZOYSEZz5MK19PuklpiZn1BEWbt3GXI/OKgZT8cZTPb+B1hd81wDI6TgEQdTu5s4fesg14VaGeBtJSQsvzdyjKCeUuRwxJBsZvmUGZtaVEpperp70jLSOc/X79L9729uMuH+sUA3ztNZeQI9HzC9W/IhQrqVCrznW8hrzJQUrexYlNL4AJ0TMpOyrJeFf+N22BuYXij/VPXs6C9laIUFat5JuwG7TAB+1oQnYAr8r/VgIstw2FyvwPXOt2ug1AwvlvZZtrKTmueWkkAIzSshN4Wf63YtEk2+z9ssPsiLv5gAhAQuGFmb/KBQWnle4uV4DeGykrh655Zal/FcPYKkFti7d225mhybkAAIlZ2DFEk+DWSD5eFBw43isO+CFgNqXlsleu6hfxOivNolCae2u1nrrzZjYAgFne7YKJBgDidY/mZgI1JwPfADOuUHYUyvSvy/1aDJPFgtfslq/uNHnrtSxrvKUJuLehbRnTD00qKAUfncRY0dPBgoru4xvghQlmtFj0VmsxMfhKurlXZDbtagEAT/26VqAVVEL4RwOg/+hC2ZFY/KrcLyUPpBWq8nJvlWbjAxI/W+u1eksWBuD19r5V5QIRe53iAad1swg5cd49V/kT2yV5mPaU/HOMX9wnAABE2s2YJIME4MPuobVk29YpSeSBSUC97ZQcfnAgQ/WLpgDbnX0vfbDGSy5kHB5TVy7Y3iz8PbDo2hTKCvC87C9GmYfXqt1uRAC5Z6b8IA9CtnEAEsAwnJqfixmDaB+bGDFRBFB0cW492Y+lVFjP7sfFQHr6KEL25L95XebnIktb89qNoLu85E+zB7vVK90Xgd88ZhJy5sSsPAV/rH2ws+TVTkq5YFXaP/wG0DiCkoNvr31QmWGPAh56dSgrf1iWbjmSBqy77UpIBPBfmZ84Y3MQer6lRyW5UJoFAODsMJAFobe7BlQ3vSxqhSVLbB7w5MVo0kpSqooWbg/2T/uGfyF/sMvZXz8aqLucUj57fEGuYEIS7V/IOjbhG7MHu0o4PfY20DxyOiGRuamvVT8WQgJg35uvMlEEkH9u+s8moZzyeHQGEPhkAiG7gafqHwt1JZfi4SBCSdyCBoJgbhlKS4r6p5Lr0lGhyYo7AJgjCIZrHo32bvsEJNwZQ8jxO3s/KNwkBva98TqcNj4GINm7YAAgFq58CJRfNltVhs5ydl2m4AOtNr2+sqzpSjr4vwAgicz+BUiYGD1SUBgzZxr264ufqSZkobCuYLxO2WpG+R7bUwGIdi4wkQFgx3uZZfkUGT7wRCV8MSG0nKAwm/GaMvf+/6aZCfZ/vAsfXFOeOdvKPhOKUmfnpolejeGHsh1BECUAnw+OrGOzoBKiYrzSTA9/lVXCV+NPFQAwmAS7D0I5pyZ9L8/ybSAp/JP5yoxVwndTo0vMHuv2/7AsjJ5lvuRjHfuBx0obVrpMV/TLvESDwwjaxEXmSz7EWLhfGyy5aR6CHODBfmNlC4U1gko4qMtLsfWZpJQlhc3W3HccAfc3tSt9yUclxBxd/pli5UdtugFbb34qz2ztfu9tAHjq362iXDDn9KNLbwVBoBLKdA58bQ8bsRMu+fSrJhfMpyIPqRaqFDKhYu9dHwCIDiBIAD7uca4tH6AyHgg0h6VwWXXwvgwHEjKPjP1atpPs8Yz/ngrWHjY91muPOpZLKXBf8smLmvKjIMTsX2Ky8BC+nni2yCxcOsKDvThuetLHZ88EQeAk/Djzkk4eghxCAHBf4HBYSAfquV2VHEQwQJRsttgeLv/wuO0IIQiAZHtBEi5brn8knzk5MIQhSNXO97k8XNo9diGU67bVzmdOEu4JvA/LM6eIT3LhfwfrZk7DDmTZqyDhriAI9iV8OfZkvjwE2SV2J3w75YJ85sTs6Eti+GLjzOnnuQl6+whBTLRw6Xfs8p+zYTZzusE4C+bfDVRwI8g5Xltwz5bvl7aDENR01T2rwyWTAInki6wyLq3rY0owo14lPhGMhx0Lir88U6wLQbpilDwGs/F7i96ecJd/RZyirOoUUNhGEOxZMM1kO215ZeXMSbJlKOif7J7atIL5N8MpFOWfGzQYauf/+hKZUKHXzvelPdYZAGbtUChMDhr5m9Lyd6yphC4A0IvXv72FfuY0aE+6PATZOBRi1/f9xoovBFQLw1/tm92ynLX/Thh7fKzXGnEkx1wo0gAFotk5EQCQenJxh5pWf3ul2vz/HrjjCHUmnCkEoGfpuUCyxnwoGFL2TGtWwfovDDd/Zx1O+H7GJa25zWwojKqntP2bNW19dttvCPptwTuDBOil7NgN/SwOBXs9OM+cjsp7cbb0zfv/U4dauf98AXDv2RBlOZVS+D87lGVPfRkPKFaNN/1W6f8ZamGQ4WgasO75cUH5f8dEAJIIpAiK/zeUiuZXSgBAd8zI/97RcvODQzOaUgdjAQBWUDggmhgAABBmAJ0BKqkAQAE+YSqRRaQioZWYpoBABgSyt31vB4d/ezfJeM88jXWFiJRl7ZHjs+3/v3NU9z+9/Hdw/9fvdb+at47/Uv+b6g/5R/zvW/9Hn/B9F3qOfQA/WD05/ZA/uv/b/cX2t///7AHoAcDd6K/GT9n/fP2m/c7kK+eBY7+4fwPoF+zPBp3B+reYF7f/a+/31MvBfsBd9p4Wv0D/a+wF/P/7f/3/uZ+mf/H/+P3K+579E/2vsD/zn+xf9L12/XH+8PsN/rb/1QGoEg8L5zv0XKpmjLJA3Aho+MHu43HcOsAme86OV73b8A4Oei7UYEmuDECcbuuI8voj6WjWuD+c+fkn4roh+Ml03z3jjp2KJhpWvSCO0HDmePKG6ag6i5Yyv7SaUsjQTMpowVWV9AMp6xkcG0Ir0Jw9RokZN13OPVLgfA0T5tAfouHp7044p2ONGiYQ8c3bIuKNQJlG9afNFgq1lXaTZts4CPB74PlxKEtrJ0a/cNmZ9m44e2Lzb44BMo2p5amMf6kdKMMPwelC4vXUvbEm8IOl7XtnLMoZAcIIFv4i4+GGh9eIxc9xqnACIjYZgx65A29neLnO1SogKylmXnjKEOvf3/K1jOiO8Nusxb4/xTV0/bCjbx3vLuW2v439+N1/ZUOE1dt1gUZtKwamKdnNSCctIm1J7NsDHesXNcFizSbouGaIf98bccGcV7L3319KjXZQ88cZZM4Z7yeiXQRY32KBDnf0InuT9Ch7Xc8RXWkzAVs2yPhdIj3a4IlYrl26DC+BK0YkLB5OGJX3h9UcNwbYm6tU3+MgqTmsr3xr8r8U2r8/VVXSFOrccaLGBp1Q2jUleiPTQ0yU+efrXfgLSsATwwMUrpVV5G9nTWD9Gv+0pjOlFhdcBHhj7YxMtP/StgoTtE1P8ZFeXqTnYCRs1JUjVOC72ECNoP95OgZC2YQusjsk4Bn1sPQvQmlm946CFptXfPY14NpmCQzqa0UcXOBKwKVtnfBfYdOr2aYw6QBoBx+iLqjgjitDADut2HqtjOJeFWO6Cnbgyh2xoEx9wErX/CXQfbiHTrFYOhf/X2+kS68UTh1bJGCP/ZGe72yHAAD+ykNU8GpaeMBHqKPFHglSP+BKU5gzOBbFQV7OL4g2/Toa38jomsvRpi7wvRfiFDW4nHB8w/Qu5T1xVg5uXKynTBxY+gDztX5V9Hg6eOxV9hKu0irDUzQHyvi3+DDTIY+kCKTWFPIhKAk/7YJ2KzDgARzFkiLQJyhFw/VvSHI8LmYEaN4jdeHLEoq4gWQmsyOzYAhJQJlmFMFxh+V9tNRfdROjRPq7/iQUNkUXtCL7LpBKPcmswVvpW9BsmbXz5B3BQkZpd8I6xStyD9Qt1z7+8e1prhm1Y1SgcpXrKQr15jbaAobj3qvChkoCK5udtf36kh/P3h4jBgXF/Ljf9HPiC6FSd52UzEv1FuVcsxIe0pg+gs57SF31FlcJrNb02F7/7YLMmnT2GmTIEUEvgtDW6qsOMjjzFs23KjUf0ADMAFigjSOOKdag1OtP27sOH5cqlFfu2qwo1xRl9ja7qmlL1SsK927JCPA4gfKTLKIoSXveL9Isye6iYMLosuvk5TG/xG517oLBQijgQDwKQE3BLbhfZP3PbaS9Yewnprx2fvgJTgNCr5JDnmrqNSlJDViY717+R72e0FYtAu/j1FQ6LngqbWL57+LBJ+JFQur1n0AXFfusKi+HGySOfSok9kwjBBP5a/c2TPRqB3marDm+Xru7Io9EmunwUZS9OP6LitnD8qgYBrbod3+MknE6lkFzLLJUcxsOGbMBumnGZzoV1cJxH2LL7cQnf3Ovpayf5cIVRXb4zXffPLYtj52mdlhJ9PylmhocdKXhw2ksBln3LzRCq07QabVRC8olNY68RvM1sAUPkMcJHvdAb7LU9yHMxWE6PMxiDf15SWSTaW3BdmcCTGTdWVKdwHOJerFnCcQ8oRLphkUbGsoInto48A5svl3yUKrD8rE4lB5gerPpMuS4FtzY66hVQtiXosF+MMDdX8pWt11ux1kSrSnGn0w/lUdG3Daix6Z4rUKI0vAch+tsglgMdjV5sNgVOqHVXo1PbG6N0bO7tCkV4ZxzG6YfqeiTIP585FCgTVUPpNxSX3mjk5OmNhnKFufd3s67/pzWXDqBqvb5VKwvQVyyLhJHWzCs9N3ZGzgTBGA2J0M/1mqYp6s8XWIhNz89a6O/5GVw+4H0WhdzA1K4gj6C5XP8sN6Q7qxIj7V3CqLU0FSlPYtZKtK2D34Rc6X71mx/pYgfSvFSt1NWmVjsrU/RYZXNqYAhs7fv46VbcgwiVXr+vSvhkERE45GeG0Yugf4+9eHAO/gLhkMIEtGvHNpuihxXqPjVwaffXDcX944H99saDS4Y1InEJy0IwNnmL3GoaP7EQnpzREWrWbmCnI8l50vnH++IFcifWXlSqoHL45KI9/Hy3E821gCgBJ9icquqS02oGLoiKqvUgXtXwPlsP4lJcoAS5GXUQiPeQmNdtAJ5V5UcxG0NL6r+IiJObbEtS8jkTQb9yrfHQVe3+t5b1mpV+SAK2bAfFEB5PjC91yTUULMt6tmTUnHu4oyBHS6X9AXvpiXs3+6ktWq/yJ4rcAKLi2WHZ4X9N3//719NBLH0i7UA4KUHq2tWAKwvprRuidxsDJ9FZJsBNgANkQynyIVwlUw97onbKJz7NQkqfUa5k0v3ez95l4tC2rErfKWWbubM8YcWbOfz00smLB2sdK8b/MjJnuWrpCLo9eGjBzXHQsYhUX24xmyL36Uz+2xg8FTP0iE+8DmrR4cTv5amEheKNrbPaIiLSRZY2jLw1Brs+6+ePJ5tzC7fl0RFVoUse01Na3IbEx09R0DGCLFsrZpDFxywxtLEtJikVOQ2UjlHCKTFjFld0Ie6wZG69Q3uuyXiv/CQml8/IgpLMf+r3eNvt2eiDdLIQAfXHPOE0vrYw4IaFX7edhxtbpYwWjUvcqsPY7C2fTu2RRdIL9TSYL6GadSDXYDjRTymkSQePnUAyUxsS9odOMbrEXtlgWEtGh5EfjFVhrr9eYAOV8n/DoLMY68B7qeSKPsszUGtD24pBhfF+h6dLKcnGpeV0fuPfPPyS/0VS6+2N/j4RC3nCvOxdtENX00pKzAe5BLC5fanoOX+6oPnHuxroEYrvKDdFBQ6etdiWVcYLhckmDovZlRWtE1ca1X1/C0AA3Ce4UC2rEid0a3iS79kJp8uPcyVqd+aVDINW/WziKfKUqMlwGeAN4RMtxz3Z6j5QkYfwiluzivyBXzY76FRKCPi5I40OzN/Rek0gVwIKGySsXV16rugqBuQUjmmEYTETWcNi1pVjtvH5Hy2o53DetdbHMWQQ6Y1U6euqyT9205e+NwDVphk+gCvyIz7uzElCPnL0oVgn1jzBbdq4mAdDjdHddVcG8lIruXmrCRW/2/RNXxXBtJC5xwP4urznUWQo8NTbv0aogWfYmRZAsq7A2+/+kF+pWO1HdVFF028lLCUld+U4iEF1z6OuNzTHg7XLPvHX9KB0IUuV18mxzIeJAo70+TLjDLKLdFi29/sE4yz3xHwjIglMzHIsqwo+XpdjwLWnwxrwXeI8xUhBV6ZVe0eZd+rL+PqqmyCG7499HP8x/0npiht7ULzoTMaWkZZwoGFLyxOv/mfYtZf4qJf9wbWA/zQx5ou9k7Z41lc9y4yHpFGgPoXLVY2gCDZIeGNra9wIIYVOO2dMuLyVfMmIENK/oZ68P/8AFGKF7Hady124ZB7ytYS8LQu1LvriDIowkFah+X+X/pvkxYZdhqnWqV1tyI+ADGgBwKmj9X/8zaEfqGhkAR9EckLC+eNA0byWpX2T2XkiIFUoDefZyQkQLrXHILuCvKhekWuzJ/38KmV+rmNkcVseZOLkANG0RK0XgaHXxO14cCsbIlCGWBnzYVkR9Ql/JXSeNp/H/EvmkzJmDuCd8JrlvDuz1L6tseC+D2UxdnM0QNC+grAj1Bsmo8Btuy2Qzl/xxkXLOV0EFw1rrY5cJy/6OZVB10noaeEKlIC2qWwq3PCqZSKGxvEhCvuhwbjUIoE/sqhuPTjF3BzsgYovSO/9892KpCgQvDeH2qyvYd1FlCM/bpY4+LXcgTRBEIsvXCqcSaRSa9CDGcACHhGenl8wZx1//pjZZRN5RJB+JJrsYExTftJNtqWcQ4gHaBUvBxI7e0ppr225KNt9LhMz6c/S/bvEy7dn2pAjCHSl/rBjwBb02NTzql7xKV5geNfnt1Sff4RPhglWeLlTYLrruDc/2suNDLYXlQZjUgsmkua8sSERsZ3aAI5rOPlRQ1Bsg1+NZS/BRDzePqoK/H4QLW1ZaOxy8f0H81FqfpTnhhVfT+8dS70dxSKcjmd0UmMquWHvbClNro8ZNlhDJkvGO7Q5LLhKrY21ocWZWcYIqvs034YNC54FwMQrB8thJPQc0lbjjiaCVR3s77AA/IkjoegtdoIb7UxrKuG74GRsMfPEdUPWLRKj/wHH9TpyRCTE0RwJ4BEMvgxCnozL+BSGBx4OaTNfCaSYxkKFyEfai9wybEMbAmEvY6N3ixkGxWk4U7Eyw5p7D3hWKOqyi1VT7DAibZWmsPtA28UyRVq8zxadEeWswhhR2dWsTDOqCnU7THe75hEV5X57Z8t/nyRH5iaiqQjfGg4vL8tXz2PaufjC7l3GnnH2dJzPVILdnGT5nTSiXWDfEF0OKcchY5quoMd/C3WMl4uiblQGd0uAhzhmro+G2dSwsWEcYiTm4tW4AThVuWwSWOQ73V2BHQKK/5L1+q5VxQjQ7o7vdQo4jMNxS4VO+mEMtBC9SMMoBIWwW2v4yqSK5C+evnPdwj42lusp6JzDCsK9+UJr1gDMIojZ4iwzdYtO995uJmYu7X0Iq+8Sgg+6oi/KmfCWqaMv8Lu0F+nZbULlQk0qXxFIlxkeNKg9s+ArjxgcRMyOOYVCW7syDTtCH/ueJ2lLcw8pvlknVCEOEYx/EDpWWbbVKs9bf9jkXAOcgbAHXcAZqmpk+qmzULyroO97pmGjdwiTEMRKTRKngjwTb2q5wRLNNs6it4+Qu4xvDz6uFO+Kx4fBaanx1qPfWeEJPZRzlOJdh3ZgHFvxHohMEovEnQmHDX7l6AYjIYT3Zz03S4q2BGd3ftK8dGuO10eJaAyI2V/owuB+/LuCUWwRu0dp6CoS5m9wDH3oQrvry5H480hPHHHdGdN7wqkn8oTKU++/SFs3LD2YCKocOkoT7c8m1h1XkNu/khdUdxLxqZvlFL/BDKx5yHKP9IArKLNJ3jYL14pM1FFhGCo+Q7NuXzTNC9FPIJStgGcNsdttasXewxyQHIEAE2utM87pp9jmnFMxn0ASCa2E2GEId4QoOiodqLk4ZCs5FfzRnSHVWjTbRCw7nsPxVkO3Lz8mQGyoWQL4Q2wGo3Pj9lnyxYfKJ5bzVIJ6U55+nsLArsRw0rJsCDBzIVPOE8pkUDNp++sor3f0zrh/oHxMp41e3itqqtnoVWxM7ZPengGS9nLDPh9SL2PFAKYFDASgDdHekHyHtS8H3XsvVv0AUKTdZeLVN3CXwgQWFGqz8/qyRSDiWDfCo+Q+olQO5wTor3czpx92KlvJffj+ZUt1sjkuUZjVybW+RUX4V/TGtu66/NPGvUj+MPzrFvBFNZagcCY7tN1iQeq3l+D70XTSH/ayj/79kNjjEyfCm0QyjExJ3l12DgvoeYddniCVpKx3BUPYPkQBGaIjXuRoESx/XHj/b4glJiRf1hSshIWynHnqSClWySXQ+M8ZH3e76SHdlNt0QL1hWVvGPpl3T2oRw8oHmmg459v81rQMnDsQ6Xmk44otQDcolmDVP7jD17KDJGpWqR6v7kbyQMK7CQDkIkxAW9gXueIQi+N/QAGtYxaaJdr2jUcD2mjiXqRgcCNNErdBolqZp8GaeUKKrQmRdFlm7CgxSfe9w6CbfYSqxUzIaql9PyCur6vQM1BatX2nALClW5UKWeOTX0mG+eKeMyNFDZfoluFHNSsbbdAY6ped0b+3C5/0CStxg+Wp1HWbQjn3lxEsIAMF1tF388AG2mH2Lqdjp8ZMTAHO5cRVO2RWrfvYiuvszUEI9KmncBHePjewIVeNW/0JpIUHQD/eBphQ4J1x2FcObiuaRyexBwdxXP02sHEn622zmu/tJVet/XqXFN4d0AJd7QVj3/QDJ8UISvPi5NQbmCp9JsQICWJ6xEeXIOWsaGb4l851sq+XPxgC1y+Mii7kUzv2gr1IARc+2AnaHNkDJpWy7YyG+eMbw6Mn6tkbkiEjW9qpLVt+RY9m9QAIlnS0pqLxDURMJjiYcYC4O/Gh7Sid9v7rM6KVB6z8ho0N3GXz/EqhYX+20fIpF5/wvSPFdJRXHafa7FiEQdNv5Ju/kEJOAKdmHXEk+GimUshXAm8EF5sVi3FXqt7adrUSYB+ObTzolQNs2FL8pvIxslMVJTPeYwKtBBsCQCDD4ovPQiY7Kk2llYMHW8tbggUplVYLgysZMSm3R4OSdPZWkH6f7yRhjzYeUV4l6Qxn3iUcp/7dQ88wB8/+iaktAQwUkmIhjav/HDKdNFwU6HRo4B3+qSCEk1oceZZOLFcc82BcmDQS0gVOgX4XK00MWZlIkAMvnus4kQGVJLDXgrltxGwKRU5HposehwMCnlI/7yEAAu3mzAut6UrS/el4lktdpTlGiHeZY/XXrs/mBDMm5LMyiBq9beoiDCMNVR1eOCtmeEE2bKscY3QaOEpNpoPsay1NX+daaKki4rCke3U8CHvcWFimaq1Bu0ptR9y9qJi1DujmPVOznqRCUcCIThpPF0cLitueV45i6P9ZEwG9P8RmJAKc6sqnmqE7N65zFeqWph00elx2mJdjAd53N0k61ceVQgjZdQmFSsz350/NvjTGHeC27rziFqiwFF71QwkHkJw3n2tTCF/fcqqbDzKrITXGte9xmR1Zki2ZU73exQOnrH9psbwP9/5E9J4d/JdTo5myVB6Y19Is+i7RhVd8pv/omlvLyIs27L4HyPnIL2g1N7wVUPQQPw3IfzZukXpSfL7IBiGoBw457dW/SRA/8q288J73/hUQ+I8Knnpw0buaSdv3mNN6PiJVDCpz5qVriUhAevt6InmH+Tdr/gbuAlvz3wtTh6JcaivqVmh7PQ3Wctx2tOVRdCbVNT3erhRcOQnc41SV2O2mMuchhJbXwhDT/WlAzwOu4o/khNu0Z6hbNMx0cPKWvPhHmtqGdYRbUy/t3itJrU3/nSTCGNlcinPUwOtYE+8LhGJ2WzO97iKsS7bRpkBSgC2MUft9yhbDRIGg398FrZAcsQtssx1YZZxElaOqJbHdtFdw7SfP8te9Y4hNqnvcxLaa04hyZvFYpbXVmMm6QOMWzSwqd59BpJsYdTUCcuhNgEJbI/mk7hwR+0jRrbrvPHqNrPozbUkbkF63s0ICO9DzRHdSvyYJJuhSCvkC/ojslu3eyUhLGrJkcWK3M1w2L779W8zhnp+beEd8nCtpXPmRiTTFLcOfAGCdGkmVWtAfDmlFKYV6Em56eEbAQgbAv9XN/wjIDfDRRr45t48uLw/VfS3uW1ERAzkfeoCK/gpuIXMyPN9H3PqHWxiqnEIuonozAiN5JBFeIdavhDi/Ae//VfnEQcnZ7mvUv9aVhr/EZVoJwA6AANr5QwwIuAGG4+pDwQN+VLmCTY4//UUstYJKlXuC1wP5wm/8cOsMbxZKvhRzrCXYPxmyaYamcybGSHj2kUNZ1lb0Xfn+8tZD60t61i9qTWTAmZOSKBEpnCxDaIW4GJJ06FZJ36KagJK2aTDOX+6ENdEZTY88a6RSAGNsjuMyPaFBJ2xLQNQz14aDFzZFa5MOMBXePBV0DRaNzRbcOnNcZpXvrjS5k9RblrLd43u36AkfsasJg9jc23f4/+Y1t2arYDWCwktEWQfIIxa4hmKV8IY5OOYWm2oabuhQpCzS5tj2LlfcGHAbAMZ0oR8nUEXgNP34+5T93hhqSxeSI94gU7LQ+hE6y+4HMEf9fkiOOb21v65q9RXyM143waEH1cQdqSCfSwAWJp6UVE3O7UJoyBOwmZ06VW7AIDlbydD4Y2u54o/fzAXqk+cBPzeNTANPaQKcCIPW1aVkmg2AXjjuvDl80It7X/2SAfiGCXeD/99Cvttgd5aGklGNUMjZ8OKBW0Qjt+k0/oI6Ps/bsD+hmScOEaV4DxCJHhmDPB54SnIOecTRCOa07cCYnQvkE1W5QfL2GjQpEzGC0ROlSUgEbRHb2SNT6+uSZfFwHLINXJt+bw1a0P3brHWH/A+W7F0FALYYEWJrwSmAYVdFybTK/8Ff95A41TT13e/DM6px0bNJOM0R44AAAA=',
  },
  {
    fileName: '스피드랙_1200x400x1800_5단_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1800,
    tier: 5,
    color: 'black',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1950_2단1행거_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'garment',
    width: 1200,
    depth: 400,
    height: 1950,
    tier: 2,
    color: 'black',
    boardColor: 'wood',
    hanger: true,
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1950_2단1행거_W_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'garment',
    width: 1200,
    depth: 400,
    height: 1950,
    tier: 2,
    color: 'white',
    boardColor: 'wood',
    hanger: true,
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x600x1800_3단_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 600,
    height: 1800,
    tier: 3,
    color: 'black',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x600x1800_3단_W_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 600,
    height: 1800,
    tier: 3,
    color: 'white',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
];

/* Parse a bare image filename into a manifest entry.
   Robust to mixed separators ( _  -  space ) and missing tokens.
   Recognizes both English and Korean tokens.
   Any field that can't be inferred is left as null.                */
function parseRenderImageFilename(fileName) {
  if (!fileName || typeof fileName !== 'string') return null;
  const base = fileName.replace(/\.[a-zA-Z0-9]+$/, ''); // strip ext
  const norm = base.replace(/[._\-]+/g, ' ').toLowerCase();

  // brand — Korean and English aliases
  let brand = null;
  if (
    /\bhomedant[ _-]?house\b/.test(norm) ||
    /\bhd[ _-]?house\b/.test(norm) ||
    /홈던트[ _-]?하우스/.test(base)
  )
    brand = 'HOMEDANT HOUSE';
  else if (
    /\bspeedrack\b/.test(norm) ||
    /\bsp(eed)?rack\b/.test(norm) ||
    /스피드랙/.test(base)
  )
    brand = 'SPEEDRACK';
  else if (/\bhomedant\b/.test(norm) || /홈던트/.test(base))
    brand = 'SPEEDRACK'; // legacy alias

  // type — Korean and English keywords (specific tokens first)
  const typeMap = [
    [/\bwasher|washing|dryer|frame[ ]?open\b|세탁기|건조기/, 'frame_open'],
    [/\bheavy|hd[ ]?shelf|heavy[ ]?duty\b|중량|헤비/, 'heavy'],
    [/\brolling|caster|wheel\b|이동|바퀴|캐스터/, 'rolling'],
    [/\bgarment|hanger|closet\b|행거|옷장|드레스/, 'garment'],
    [/\bpegboard|peg[ ]?board\b|타공판|페그보드/, 'pegboard'],
    [/\bdrawer\b|서랍/, 'drawer'],
    [/\bcabinet\b|캐비닛|장식장|문/, 'cabinet'],
    [/\bopen[ ]?base|open shelf\b|개방형/, 'open_base'],
    [/\bshelf|rack\b|선반|랙/, 'shelf'],
  ];
  let type = null;
  for (const [rx, t] of typeMap) {
    if (rx.test(norm) || rx.test(base)) {
      type = t;
      break;
    }
  }

  // dimensions  e.g.  1200x400x1800   or  1200 400 1800
  let width = null,
    depth = null,
    height = null;
  const dimX = base.match(/(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})/i);
  if (dimX) {
    width = parseInt(dimX[1], 10);
    depth = parseInt(dimX[2], 10);
    height = parseInt(dimX[3], 10);
  } else {
    const trip = base.match(/(\d{2,4})[ ._\-]+(\d{2,4})[ ._\-]+(\d{2,4})/);
    if (trip) {
      width = parseInt(trip[1], 10);
      depth = parseInt(trip[2], 10);
      height = parseInt(trip[3], 10);
    }
  }

  // tier  — English (5tier / 5T) and Korean (5단)
  let tier = null;
  const tK = base.match(/(\d)\s*단/);
  const t1 = norm.match(/(\d)\s*[ -]?\s*tier/);
  const t2 = norm.match(/tier\s*[ -]?\s*(\d)/);
  const t3 = norm.match(/\b(\d)\s*t\b/);
  if (tK) tier = parseInt(tK[1], 10);
  else if (t1) tier = parseInt(t1[1], 10);
  else if (t2) tier = parseInt(t2[1], 10);
  else if (t3) tier = parseInt(t3[1], 10);

  // color — English, Korean, and B/W shorthand used in the rendering set
  let color = null;
  if (/\bblack\b|블랙|검정/.test(base) || /\bblack\b/.test(norm))
    color = 'black';
  else if (/\bwhite\b|화이트|흰/.test(base) || /\bwhite\b/.test(norm))
    color = 'white';
  else if (/\bgray|grey\b|회색/.test(base) || /\bgray|grey\b/.test(norm))
    color = 'gray';
  else {
    // _B_ or _W_ shorthand (only when bounded by underscores/dots)
    const sh = base.match(/[_.\- ]([BW])[_.\- ]/);
    if (sh) color = sh[1] === 'B' ? 'black' : 'white';
  }

  // hanger detection (Korean 행거, English hanger). Garment racks usually
  // already set type via the type map; this is an auxiliary flag.
  const hanger = /행거/.test(base) || /\bhanger\b/.test(norm) || null;

  return { fileName, brand, type, width, depth, height, tier, color, hanger };
}

/* Convenience: pass a list of filenames (and an optional base URL
   prefix) — this function fills the manifest for you.              */
function registerRenderImagesByFilename(list, baseUrl = '/assets/renderings/') {
  for (const f of list) {
    const meta = parseRenderImageFilename(f);
    if (!meta) continue;
    meta.url = baseUrl + f;
    RENDER_IMAGE_MANIFEST.push(meta);
  }
}

/* Map a product type to the brand bucket that holds its renderings.
   Most exhibition items have no renderings — they simply fall back.
   We strictly require type match — a shelf shouldn't show a garment
   rack image just because it's the same brand.                       */
function findRenderImage(product, tpl) {
  if (!product || !tpl || !RENDER_IMAGE_MANIFEST.length) return null;
  const wantBrand = tpl.brand;
  const wantType = tpl.type;
  // strict: same brand AND same type
  const strict = RENDER_IMAGE_MANIFEST.filter(
    (m) => m.brand === wantBrand && m.type === wantType
  );
  if (strict.length) return scoreBestMatch(strict, product) || strict[0];
  // looser: same brand only (drop a slight notice via no exact type)
  // — only if no strict match at all
  return null;
}

function scoreBestMatch(candidates, p) {
  let best = null,
    bestScore = -Infinity;
  for (const c of candidates) {
    let s = 0;
    // color match weighs the most — visually most obvious
    if (c.color && p.frameColor && c.color === p.frameColor) s += 100;
    // board color match — adds nice color fidelity
    if (c.boardColor && p.boardColor && c.boardColor === p.boardColor) s += 30;
    // tier exact match
    if (c.tier && p.tier && c.tier === p.tier) s += 40;
    // dimension closeness — log scale on the W*D*H ratio
    if (c.width && c.depth && c.height) {
      const ratio =
        Math.abs(c.width - p.width) / Math.max(c.width, p.width) +
        Math.abs(c.depth - p.depth) / Math.max(c.depth, p.depth) +
        Math.abs(c.height - p.height) / Math.max(c.height, p.height);
      s += 30 - ratio * 20;
    }
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

/* ============================================================
   UNIT CONVERSION HELPERS
   ============================================================ */
const MM_PER_FT = 304.8;
const MM_PER_IN = 25.4;
const MM_TO_M = 0.001;
const toMM = (val, unit) => {
  if (unit === 'mm') return val;
  if (unit === 'cm') return val * 10;
  if (unit === 'm') return val * 1000;
  if (unit === 'ft') return val * MM_PER_FT;
  return val;
};
const fromMM = (mm, unit) => {
  if (unit === 'mm') return Math.round(mm);
  if (unit === 'cm') return +(mm / 10).toFixed(1);
  if (unit === 'm') return +(mm / 1000).toFixed(2);
  if (unit === 'ft') return +(mm / MM_PER_FT).toFixed(2);
  return mm;
};
const mmToInch = (mm) => +(mm / MM_PER_IN).toFixed(1);

/* ============================================================
   3D MESH BUILDER
   ============================================================ */
const FRAME_COLORS = { black: 0x2a2a2e, white: 0xffffff };
/* Frame colours offered in the buyer configurator. The new ones are
   on-screen proposals, not production colours: the real powder-coat
   shade is settled with a physical sample.                            */
const SHELF_COLORS = [
  ['white', 'White', 0xffffff, 'standard'],
  ['black', 'Black', 0x2a2a2e, 'standard'],
  ['oat', 'Oat', 0xdcd4c4, 'new'],
  ['milktea', 'Milk tea', 0xc8b59b, 'new'],
  ['sage', 'Sage green', 0xa7b29c, 'new'],
  ['warmgrey', 'Warm grey', 0x9b9893, 'new'],
  ['dustyblue', 'Dusty blue', 0x9aaab8, 'new'],
  ['charcoal', 'Charcoal', 0x4a4c51, 'new'],
];
SHELF_COLORS.forEach(([k, , hex]) => {
  FRAME_COLORS[k] = hex;
});
// a colour key from the list above, or a custom '#rrggbb'
function frameHexOf(key) {
  if (FRAME_COLORS[key] !== undefined) return FRAME_COLORS[key];
  if (typeof key === 'string' && /^#[0-9a-f]{6}$/i.test(key)) return parseInt(key.slice(1), 16);
  return 0x333333;
}
function isLightHex(hex) {
  const r = (hex >> 16) & 255,
    g = (hex >> 8) & 255,
    b = hex & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}
function colorLabel(key) {
  const c = SHELF_COLORS.find(([k]) => k === key);
  const hex = '#' + frameHexOf(key).toString(16).padStart(6, '0').toUpperCase();
  return c ? `${tr(c[1])} ${hex}` : hex;
}
// which app opens: '?buyer' goes straight to the buyer configurator (the
// link sent to buyers), '?booth' to the booth planner, nothing to the start
// screen where our team picks one
const APP_MODE =
  typeof window === 'undefined'
    ? 'booth'
    : /[?&]buyer\b/.test(window.location.search)
    ? 'buyer'
    : /[?&]booth\b/.test(window.location.search)
    ? 'booth'
    : null;
const BUYER_MODE = APP_MODE === 'buyer';
const openApp = (mode) => {
  window.location.search = mode ? '?' + mode : '';
};
const BOARD_COLORS = { wood: 0xc8a877, white: 0xffffff, black: 0x222222 };
// The scene lights add up to about 1.46x on faces that point straight up,
// which washed the old boards out to pale yellow. Up-facing board faces
// are tinted down by that factor so they land on the real board colour;
// edges and undersides get less light and are left untinted.
const WOOD_TOP_TINT = 0xb0b0b0; // ~0.69
const WHITE_TOP = 0xa2a2a0; // ~0.63 -> reads as white under the top light
const WHITE_SIDE = 0xf2f2f0;

/* Human-readable text for each placement-warning reason code.
   Used by the "Layout Check" panel so users see WHY an item is flagged
   instead of a bare count.                                             */
const WARNING_REASON_TEXT = {
  overlap: 'Overlapping with another product',
  out_of_bounds: 'Outside booth boundary',
};
const WARNING_REASON_SHORT = {
  overlap: 'Overlap',
  out_of_bounds: 'Outside booth',
};
function warningReasonLabel(reason) {
  return tr(WARNING_REASON_TEXT[reason] || 'Needs placement review');
}

/* --- Wood face texture for shelf boards ---
   Taken from the HOMEDANT board render (wood face, flattened to a
   2048x1024 image). The texture is a canvas: it starts as a flat wood
   tone and the photo is painted in as soon as it decodes, so every
   material that already holds a clone picks it up automatically.
   One image covers WOOD_TEX_W x WOOD_TEX_D metres of board; board
   geometry scales its UVs to that size (see makeBoardGeometry), and the
   texture mirrors at the seams so larger boards never show a hard join. */
const WOOD_TEX_W = 1.2; // metres covered along the grain
const WOOD_TEX_D = 0.6; // metres covered across the grain
const WOOD_PHOTO_DATA_URL =
  'data:image/jpeg;base64,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';
let _woodTex = null;
let _woodPhotoReady = false;
const _woodPending = new Set();
function makeWoodTexture() {
  if (_woodTex) return _woodTex;
  const W = 2048,
    H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#c69d7d'; // average tone of the photo, shown until it loads
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.MirroredRepeatWrapping;
  tex.wrapT = THREE.MirroredRepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  // clones made before the photo decodes are re-flagged once it is painted
  const baseClone = tex.clone.bind(tex);
  tex.clone = () => {
    const c = baseClone();
    c.needsUpdate = true;
    if (!_woodPhotoReady) _woodPending.add(c);
    return c;
  };

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, W, H);
    _woodPhotoReady = true;
    tex.needsUpdate = true;
    _woodPending.forEach((c) => {
      c.needsUpdate = true;
    });
    _woodPending.clear();
  };
  img.src = WOOD_PHOTO_DATA_URL;

  _woodTex = tex;
  return tex;
}

/* --- Shelf board geometry ---
   A box whose UVs are scaled to real size, so the wood grain keeps the
   same scale on every board regardless of its width/depth, and the thin
   edges show a narrow strip of grain running along the edge instead of
   the whole image squashed into 9 mm. `seed` shifts the pattern so the
   tiers of one shelf don't all show the identical piece of wood.
   Material slots (BoxGeometry order): 0 +x, 1 -x, 2 top, 3 bottom,
   4 +z (front), 5 -z (back).                                            */
function makeBoardGeometry(w, t, d, seed = 0) {
  const geo = new THREE.BoxGeometry(w, t, d);
  const uv = geo.attributes.uv;
  const frac = (v) => v - Math.floor(v);
  const offU = frac(seed * 7.31) * 2;
  const offV = frac(seed * 3.17) * 2;
  // 4 vertices per face, faces in the slot order above
  const scale = [
    [d / WOOD_TEX_W, t / WOOD_TEX_D], // +x edge: grain runs along depth
    [d / WOOD_TEX_W, t / WOOD_TEX_D], // -x edge
    [w / WOOD_TEX_W, d / WOOD_TEX_D], // top
    [w / WOOD_TEX_W, d / WOOD_TEX_D], // bottom
    [w / WOOD_TEX_W, t / WOOD_TEX_D], // front edge: grain runs along width
    [w / WOOD_TEX_W, t / WOOD_TEX_D], // back edge
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(
        k,
        offU + uv.getX(k) * scale[f][0],
        offV + f * 0.13 + uv.getY(k) * scale[f][1]
      );
    }
  }
  uv.needsUpdate = true;
  return geo;
}

/* Fit the key light's shadow area to the booth so the shadow map's
   pixels are spent on the booth instead of empty space around it. */
function fitShadowToBooth(light, w, d, h) {
  const r = Math.sqrt(w * w + d * d) / 2 + 0.6; // booth footprint + margin
  const cam = light.shadow.camera;
  cam.left = -r;
  cam.right = r;
  cam.top = r + h * 0.5;
  cam.bottom = -r;
  const dist = light.position.length();
  cam.near = Math.max(0.5, dist - r - h - 1);
  cam.far = dist + r + 2;
  cam.updateProjectionMatrix();
  // keep roughly 3 mm per shadow pixel; cap for very large booths
  const size = r * 2 > 14 ? 2048 : 4096;
  if (light.shadow.mapSize.x !== size) {
    light.shadow.mapSize.set(size, size);
    if (light.shadow.map) {
      light.shadow.map.dispose();
      light.shadow.map = null;
    }
  }
}

/* --- Hole-pattern texture for SPEEDRACK angle posts ---
   SPEEDRACK uses slotted angle steel: a thin L-profile post with a
   regular column of holes punched down its length. This generates a
   CanvasTexture with that repeating hole pattern. Cached by base color,
   cloned per material so each post sets its own vertical UV repeat.    */
const _slotTexCache = {};
function makeSlotPostTexture(baseHex) {
  if (_slotTexCache[baseHex]) return _slotTexCache[baseHex];

  const TILE_W = 32,
    TILE_H = 40; // one hole-pair pitch per tile
  const cv = document.createElement('canvas');
  cv.width = TILE_W;
  cv.height = TILE_H;
  const ctx = cv.getContext('2d');

  const r = (baseHex >> 16) & 0xff;
  const g = (baseHex >> 8) & 0xff;
  const b = baseHex & 0xff;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, TILE_W, TILE_H);

  const luma = (r * 299 + g * 587 + b * 114) / 1000;
  const isDark = luma < 128;

  // Holes punched through the steel — render as dark voids with a faint
  // bright rim so they read as actual holes, not painted dots.
  const holeFill = isDark ? 'rgba(0,0,0,0.95)' : 'rgba(70,70,74,0.92)';
  const holeRim = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.16)';

  const cx = TILE_W / 2;

  /* Keyhole-shaped hole — matches real slotted-angle shelving:
     a round hole at the top flowing into a narrower straight slot
     below it. yTop = top of the round part, total height = h.        */
  function punchKeyhole(yTop, h) {
    const rTop = 3.4; // radius of the round head
    const slotW = 3.0; // width of the straight slot
    const headCy = yTop + rTop; // center of the round head
    const slotTop = headCy; // slot starts at head center
    const slotBot = yTop + h; // slot ends here
    ctx.beginPath();
    // round head
    ctx.arc(cx, headCy, rTop, Math.PI, 0, false);
    // right side down
    ctx.lineTo(cx + slotW / 2, slotBot - slotW / 2);
    // rounded bottom of the slot
    ctx.arc(cx, slotBot - slotW / 2, slotW / 2, 0, Math.PI, false);
    // left side back up
    ctx.lineTo(cx - rTop, headCy);
    ctx.closePath();
    ctx.fillStyle = holeFill;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = holeRim;
    ctx.stroke();
  }

  // two keyholes per tile, evenly spaced down the post
  punchKeyhole(TILE_H * 0.06, TILE_H * 0.38);
  punchKeyhole(TILE_H * 0.54, TILE_H * 0.38);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  _slotTexCache[baseHex] = tex;
  return tex;
}

/* HOMEDANT wordmark (logo without the slogan, transparent background).
   Used for the product-library tab and for the sign on the booth wall. */
const HOMEDANT_WORDMARK_URL =
  'data:image/png;base64,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';
const HOMEDANT_WORDMARK_ASPECT = 6.355; // width / height

/* ----- interface language -----
   English text is the key. tr() returns the Korean text when Korean is
   selected and a translation exists, otherwise the English as written,
   so a missing entry simply shows in English. Add or edit Korean
   wording in KO below.                                                */
let _lang = 'en';
const KO = {
  "Booth Simulator": "부스 시뮬레이터",
  "Booth": "부스",
  "Width": "폭",
  "Depth": "깊이",
  "Wall H": "벽 높이",
  "Height": "높이",
  "Templates": "템플릿",
  "Booth Type": "부스 유형",
  "Wall Booth": "벽체 부스",
  "Curtain Booth": "커튼 부스",
  "Solid panel walls": "단단한 패널 벽",
  "Pole frame with fabric curtains": "파이프 프레임과 천 커튼",
  "Look": "분위기",
  "Plan": "도면",
  "Carpet": "회색 카펫",
  "Dark hall": "어두운 전시장",
  "White floor with grid": "흰 바닥과 격자",
  "Grey carpet, white walls": "회색 카펫, 흰 벽",
  "Dark floor, blue aisle": "어두운 바닥, 파란 통로",
  "Visitors": "관람객",
  "Show people walking past the booth": "부스 앞을 지나가는 사람 표시",
  "Layout": "레이아웃",
  "layout name": "레이아웃 이름",
  "Used in exported PNG filenames": "PNG 파일 이름에 사용됩니다",
  "Start a new, empty booth layout": "빈 부스로 새로 시작",
  "Create Layout": "새 레이아웃",
  "Top": "위",
  "Front": "정면",
  "Save current view as PNG": "현재 화면을 PNG로 저장",
  "Export front / top / 45° views as 3 PNGs": "정면, 위, 45도 화면을 PNG 3장으로 저장",
  "Export Images": "이미지 내보내기",
  "Save this booth design to the in-app library": "이 부스 디자인을 앱 보관함에 저장",
  "Save Design": "디자인 저장",
  "Show / hide the Design Library": "디자인 보관함 열기 / 닫기",
  "Library": "보관함",
  "Download as JSON file": "JSON 파일로 내려받기",
  "Load JSON file": "JSON 파일 불러오기",
  "Load": "불러오기",
  "Product Library": "제품 목록",
  "EXHIBITION": "전시 소품",
  "Items placed": "배치한 제품",
  "Layout Check": "배치 점검",
  "L-Drag": "왼쪽 드래그",
  "rotate": "회전",
  "R-Drag": "오른쪽 드래그",
  "pan": "이동",
  "Wheel": "휠",
  "zoom": "확대",
  "Click": "클릭",
  "select": "선택",
  "wall": "벽",
  " item needs attention": "개 제품 확인 필요",
  " items need attention": "개 제품 확인 필요",
  " item": "개",
  " items": "개",
  "Placement review": "배치 확인",
  "Review": "확인",
  "Needs placement review": "배치 확인이 필요합니다",
  "Overlapping with another product": "다른 제품과 겹칩니다",
  "Outside booth boundary": "부스 밖으로 나갔습니다",
  "Overlap": "겹침",
  "Outside booth": "부스 밖",
  "These are placement reminders, not errors. Adjust positions to clear them.": "오류가 아니라 배치 알림입니다. 위치를 옮기면 사라집니다.",
  "Design Library": "디자인 보관함",
  "Close": "닫기",
  "Save Current Booth": "현재 부스 저장",
  "No saved designs yet.": "저장된 디자인이 없습니다.",
  "Click \"Save Current Booth\" to store this layout.": "\"현재 부스 저장\"을 누르면 이 레이아웃이 저장됩니다.",
  "Click to load this design": "눌러서 이 디자인 불러오기",
  "Rename": "이름 변경",
  "Delete": "삭제",
  "Designs are stored in this browser only.": "디자인은 이 브라우저에만 저장됩니다.",
  "Select a product to edit": "편집할 제품을 선택하세요",
  "or click a product in the library to add": "또는 목록에서 제품을 눌러 추가하세요",
  "No reference image": "참고 이미지 없음",
  "Reference image: ": "참고 이미지: ",
  "Reference image: not available": "참고 이미지: 없음",
  "Current setting: ": "현재 설정: ",
  "Dimensions": "크기",
  "Tier": "단수",
  "-Tier": "단",
  "Colors": "색상",
  "Frame": "프레임",
  "Board": "합판",
  "Shelf style (all levels)": "선반 스타일 (전체 단)",
  "black": "블랙",
  "white": "화이트",
  "wood": "우드",
  "Shelf Levels": "단별 설정",
  "Height from the post bottom to the top of each level. Level 1 is the lowest.": "기둥 바닥부터 각 단 윗면까지의 높이입니다. 1번이 가장 아랫단입니다.",
  "Switch this level between basic and basket": "이 단을 basic / basket으로 전환",
  "Reset to even spacing": "균등 간격으로 되돌리기",
  "Position & Rotation": "위치와 회전",
  "Range": "범위",
  "Rotation": "회전",
  "Add-on Options": "추가 옵션",
  "Summary": "요약",
  "Duplicate": "복제",
  "House Shelf": "일반 선반",
  "House Garment Rack": "행거 선반",
  "House Rolling Shelf": "바퀴선반",
  "House Slim Shelf": "틈새선반",
  "House Open Base Shelf": "오픈베이스 선반",
  "House Pegboard Shelf": "타공선반",
  "House Trolley": "트롤리",
  "House Perforated Trolley": "타공 트롤리",
  "Trolley": "트롤리",
  "Perforated Trolley": "타공 트롤리",
  "House Drawer Shelf": "서랍행거",
  "House Cabinet Shelf": "캐비닛 선반",
  "Shelf": "일반 선반",
  "Heavy Duty Shelf": "중량 선반",
  "Washer / Dryer Shelf": "세탁기 선반",
  "Washing Machine Shelf": "세탁기 선반",
  "Slim Shelf": "틈새선반",
  "Open Base Shelf": "오픈베이스 선반",
  "Garment Rack": "행거 선반",
  "Rolling Shelf": "바퀴선반",
  "Drawer Shelf": "서랍행거",
  "Cabinet Shelf": "캐비닛 선반",
  "Pegboard Shelf": "타공선반",
  "Banner Stand": "롤업 배너",
  "Catalog Stand": "카탈로그 거치대",
  "Chair": "의자",
  "Counseling Table": "상담 테이블",
  "Poster Panel": "포스터 패널",
  "Sample Display Table": "샘플 진열대",
  "TV Stand": "TV 거치대",
  "Logo Table": "로고 테이블",
  "Display items": "진열 물건",
  "Auto": "자동",
  "None": "없음",
  "Box": "상자",
  "Basket": "바구니",
  "Books": "책",
  "Books (flat)": "눕힌 책",
  "Jars": "유리병",
  "Plant": "화분",
  "Vase": "꽃병",
  "Towels": "수건",
  "Soccer ball": "축구공",
  "Suitcase": "캐리어",
  "Picture frame": "액자",
  "Fruit bowl": "과일 그릇",
  "Canned food": "캔 식품",
  "Snack boxes": "과자 박스",
  "Floor": "바닥",
  "Washing machine": "세탁기",
  "The washing machine does not fit. Use a width of 700 or more and raise the lowest level.": "세탁기가 들어가지 않습니다. 폭을 700 이상으로 하고 가장 아래 단을 올려주세요.",
  "Laptop": "노트북",
  "Booth Staff": "부스 직원",
  "Buyer folders": "바이어 폴더",
  "Booth layouts": "부스 레이아웃",
  "Shared with the team": "팀 공용",
  "Working…": "처리 중…",
  "Enter the team code": "팀 코드를 입력하세요",
  "Saved layouts and proposals are shared by everyone on the team. This computer will remember the code.": "저장한 레이아웃과 제안은 팀 전체가 함께 씁니다. 이 컴퓨터는 코드를 기억합니다.",
  "Open": "열기",
  "The team code is not correct.": "팀 코드가 맞지 않습니다.",
  "Could not reach the shared library.": "공용 저장소에 연결하지 못했습니다.",
  "Save current work": "지금 작업 저장",
  "No folder": "폴더 없음",
  "Save as new": "새로 저장",
  "Overwrite": "덮어쓰기",
  "All": "전체",
  "New folder": "새 폴더",
  "New folder inside": "이 폴더 안에 새 폴더",
  "Folder name": "폴더 이름",
  "MAX 200 Shelf": "경량랙",
  "MAX 200 Rolling Shelf": "경량랙 바퀴형",
  "MAX 200": "경량랙",
  "steel": "스틸",
  "Buyers": "바이어",
  "Buyer name": "바이어 이름",
  "New buyer folder": "새 바이어 폴더",
  "New proposal for this buyer": "이 바이어에 새 제안",
  "Manage folders": "폴더 관리",
  "Click to start a new proposal": "누르면 새 제안으로 시작",
  "No buyer selected": "바이어 선택 안 함",
  "New proposal (not saved)": "새 제안 (저장 안 됨)",
  "Outer size": "실제 외곽 치수",
  "Cancel": "취소",
  "will be deleted for everyone on the team.": "항목을 삭제합니다. 팀 전체에서 지워집니다.",
  "Delete this folder? What is inside moves up one level.": "이 폴더를 삭제할까요? 안에 있던 항목은 한 단계 위로 옮겨집니다.",
  "Name": "이름",
  "Move to folder": "폴더 이동",
  "Nothing saved here yet.": "아직 저장된 항목이 없습니다.",
  "Upload designs saved on this computer": "이 컴퓨터에 저장된 디자인 올리기",
  "designs uploaded.": "개 디자인을 올렸습니다.",
  "Shelf simulator": "선반 시뮬레이터",
  "Trade show booth planner": "전시회 부스 시뮬레이터",
  "Lay out a booth for an overseas trade show: products, display items, staff and visitors.": "해외 전시회 부스를 꾸밉니다. 제품 배치, 진열 소품, 직원과 관람객까지.",
  "For our team": "사내용",
  "Buyer proposal configurator": "바이어 제안 시뮬레이터",
  "Set a shelf size and colors, compare colors side by side, and export a proposal image for a buyer.": "선반 사이즈와 컬러를 정하고 컬러를 나란히 비교한 뒤, 바이어에게 보낼 제안 이미지로 내보냅니다.",
  "For our team: buyer proposals": "사내용 · 바이어 제안",
  "Export proposal image": "제안 이미지 내보내기",
  "Save screen": "화면 저장",
  "Back to start": "처음 화면으로",
  "Shelf Color Configurator": "선반 컬러 시뮬레이터",
  "Save image": "이미지 저장",
  "Products": "제품",
  "Tiers": "단수",
  "Frame color": "프레임 컬러",
  "Standard": "기본 컬러",
  "New color proposals": "신규 컬러 제안",
  "Custom color": "직접 지정",
  "Selected": "선택",
  "Plywood board": "합판",
  "Wood face up": "우드 면 위로",
  "White face up": "화이트 면 위로",
  "Steel (frame color)": "스틸 (프레임 색)",
  "Wood": "우드",
  "Compare colors": "컬러 비교",
  "Add 2 to 4 colors to see them side by side.": "2~4개 컬러를 담으면 나란히 비교해서 보여줍니다.",
  "Add selected color": "선택한 컬러 담기",
  "Clear": "비우기",
  "Colors on screen are approximate. Final colors are confirmed with a physical sample.": "화면 색상은 근사치입니다. 최종 색상은 실물 샘플로 확정합니다.",
  "Oat": "오트",
  "White": "화이트",
  "Black": "블랙",
  "Milk tea": "밀크티",
  "Sage green": "세이지 그린",
  "Warm grey": "웜 그레이",
  "Dusty blue": "더스티 블루",
  "Charcoal": "차콜",
  "Basic": "기본",
  "Levels": "단",
  "Display": "진열",
  "Enter position": "위치 직접 입력",
  "Rotate": "회전",
  "In this booth": "부스에 놓인 제품",
  "Click a product here or in the 3D view to edit it.": "여기나 3D 화면에서 제품을 누르면 편집할 수 있습니다.",
  "Add products from the list on the left.": "왼쪽 목록에서 제품을 추가하세요.",
  "Tip: drag a board of the selected shelf up or down in the 3D view.": "팁: 3D 화면에서 선택한 선반의 합판을 위아래로 끌어도 됩니다.",
  "Show name": "전시회 이름",
  "Type the show name": "전시회 이름 입력",
  "My designs": "내 디자인",
  "Export": "내보내기",
  "Save": "저장",
  "Design library": "디자인 보관함",
  "Open JSON file": "JSON 파일 열기",
  "Current view (PNG)": "현재 화면 (PNG)",
  "Front, top and 45° (3 PNGs)": "정면·위·45° (PNG 3장)",
  "Layout file (JSON)": "레이아웃 파일 (JSON)",
  "Language": "언어",
  "Booth settings": "부스 설정",
  "Size": "크기",
  "Unit": "단위",
  "New layout": "새 레이아웃",
  "Manager Lee": "이과장",
  "Staff": "직원",
  "Name tag": "이름표",
  "Speech bubble": "말풍선",
  "Glasses": "안경",
  "Shirt": "상의",
  "Hair": "머리",
  "short": "짧은 머리",
  "parted": "가르마",
  "navy": "네이비",
  "grey": "그레이",
  "blue": "블루",
  "TV": "TV",
  "Hanger bars": "행거봉 수",
  "Choose an item for each spot, left to right. Level 1 is the lowest.": "칸마다 놓을 물건을 고르세요. 왼쪽부터 순서대로이고, 1번이 가장 아랫단입니다.",
  "Reset to auto": "자동으로 되돌리기",
  "off": "끔",
  "on": "켬",
  "additional shelf": "추가 선반",
  "cabinet": "캐비닛",
  "caster": "바퀴",
  "curtain": "커튼",
  "drawer": "서랍",
  "handle": "손잡이",
  "hanger bar": "행거봉",
  "pegboard": "타공 패널",
  "side panel": "측면 패널",
  "Save design as:": "저장할 디자인 이름:",
  "Rename design:": "새 이름:",
  "Saved": "저장됨",
  "Start a new layout? This clears the current booth.\nSave it to the Design Library first if you want to keep it.": "새 레이아웃을 시작할까요? 현재 부스가 지워집니다.\n남겨 두려면 먼저 디자인 보관함에 저장하세요.",
  "Invalid JSON file: ": "잘못된 JSON 파일: ",
  "Could not save to browser storage: ": "브라우저에 저장하지 못했습니다: ",
};
function tr(s) {
  return _lang === 'ko' && KO[s] !== undefined ? KO[s] : s;
}
function loadLang() {
  try {
    return window.localStorage.getItem('hbs-lang') === 'ko' ? 'ko' : 'en';
  } catch (e) {
    return 'en';
  }
}

/* ----- booth looks -----
   'plan'   - the original drawing-like view: white floor with a grid
   'carpet' - show floor: grey carpet, white walls, logo sign
   'dark'   - dark hall floor with a blue aisle, like a convention centre
   Colours are material colours; up-facing surfaces read about 1.46x
   brighter on screen under the scene lights.                          */
// UI tones: panels a pale grey, the 3D view a step darker so white walls
// stand out, white for anything you can click or type into
const UI_PANEL = '#f7f7f5';
const UI_LINE = '#e3e3df';

// look used for new booths and for saved layouts made before looks existed
const DEFAULT_LOOK = 'carpet';
const BOOTH_LOOKS = {
  plan: {
    label: 'Plan',
    hint: 'White floor with grid',
    background: 0xe4e5e8,
    floor: 0xfafafa,
    grid: true,
    carpet: false,
    aisle: null,
    sign: false,
  },
  carpet: {
    label: 'Carpet',
    hint: 'Grey carpet, white walls',
    background: 0xdcdde0,
    floor: 0x6a6c70,
    grid: false,
    carpet: true,
    aisle: 0x55575b,
    sign: true,
  },
  studio: {
    label: 'Studio',
    hint: 'Plain floor, no booth',
    background: 0xe6e6e3,
    floor: 0xa9a9a6, // (no floor is drawn in the studio)
    grid: false,
    carpet: false,
    aisle: null,
    sign: false,
  },
  dark: {
    label: 'Dark hall',
    hint: 'Dark floor, blue aisle',
    background: 0x3a3d43,
    floor: 0x2a2b2e,
    grid: false,
    carpet: true,
    aisle: 0x2f4d73,
    sign: true,
  },
};

let _carpetTex = null;
function makeCarpetTexture() {
  if (_carpetTex) return _carpetTex;
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const v = 205 + Math.floor(Math.random() * 50); // fine loop-pile speckle
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  _carpetTex = tex;
  return tex;
}
function makeCarpetMaterial(color, w, d) {
  const tex = makeCarpetTexture().clone();
  tex.repeat.set(w / 0.4, d / 0.4);
  tex.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    color,
    map: tex,
    roughness: 1,
    metalness: 0,
  });
}
/* Logo sign: the wordmark on a flat panel facing the front of the booth */
function makeLogoSign(width) {
  const tex = new THREE.TextureLoader().load(HOMEDANT_WORDMARK_URL);
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / HOMEDANT_WORDMARK_ASPECT),
    mat
  );
}

/* ----- visitors -----
   Simple mannequin figures that stroll along the aisle in front of the
   booth. Some walk straight past; others stop, turn to look at the booth
   for a few seconds and move on. They stay in the aisle, so they never
   walk through the products, and they give a sense of human scale.
   Returns the group to add to the scene and a tick(dt) to call every
   frame.                                                              */
/* A speech bubble that always faces the camera and draws on top, so it
   is never hidden behind shelves. Returns a sprite about `width` metres
   wide, its tail pointing down at y = 0.                               */
function makeSpeechBubble(text, width = 0.9) {
  const c = document.createElement('canvas');
  const x = c.getContext('2d');
  const font = 'bold 44px Arial, "Malgun Gothic", sans-serif';
  x.font = font;
  const tw = Math.min(900, Math.ceil(x.measureText(text).width));
  c.width = tw + 80;
  c.height = 150;
  x.font = font;
  const W = c.width,
    bh = 104,
    r = 30;
  x.fillStyle = '#ffffff';
  x.strokeStyle = '#2b2b2b';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(r + 3, 3);
  x.arcTo(W - 3, 3, W - 3, bh, r);
  x.arcTo(W - 3, bh, 3, bh, r);
  x.lineTo(W / 2 + 22, bh);
  x.lineTo(W / 2, 146);
  x.lineTo(W / 2 - 10, bh);
  x.arcTo(3, bh, 3, 3, r);
  x.arcTo(3, 3, W - 3, 3, r);
  x.closePath();
  x.fill();
  x.stroke();
  x.fillStyle = '#1a1a1a';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, W / 2, bh / 2 + 2, W - 50);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true })
  );
  const w = Math.min(1.6, width * (W / 520));
  sprite.scale.set(w, (w * c.height) / W, 1);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 999;
  return sprite;
}
/* A soft shadow that fades out around a product's footprint, for the
   buyer view where cast shadows are off: it keeps the product standing
   on something without drawing a floor.                               */
let _contactTex = null;
function makeContactShadow(w, d) {
  if (!_contactTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.filter = 'blur(22px)';
    x.fillStyle = '#000';
    x.fillRect(58, 58, 140, 140);
    _contactTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 1.75, d * 1.75 + 0.2),
    new THREE.MeshBasicMaterial({ map: _contactTex, transparent: true, opacity: 0.32, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  m.renderOrder = -1;
  m.userData.sharedAsset = true; // the texture is shared
  return m;
}
const VISITOR_LINES = [
  'Hi, your items look great!',
  'Love these shelves!',
  'Is this all steel?',
  'Can I see the catalog?',
  'Wow, so sturdy!',
];

/* Clamp a product's position so its whole footprint stays inside the
   booth (bw x bd in mm). Rotations are in 90 degree steps.           */
function clampToBooth(p, bw, bd) {
  const turned = Math.round((p.rotation || 0) / 90) % 2 === 1;
  const hw = ((turned ? p.depth : p.width) * MM_TO_M) / 2;
  const hd = ((turned ? p.width : p.depth) * MM_TO_M) / 2;
  const lim = (v, h, half) => (half - h <= 0 ? 0 : Math.max(-half + h, Math.min(half - h, v)));
  return {
    x: lim(p.position.x, hw, (bw * MM_TO_M) / 2),
    z: lim(p.position.z, hd, (bd * MM_TO_M) / 2),
  };
}
const keepIn = (p, booth) => {
  const c = clampToBooth(p, booth.width, booth.depth);
  return c.x === p.position.x && c.z === p.position.z ? p : { ...p, position: c };
};

function createVisitors(w, d) {
  const group = new THREE.Group();
  const count = Math.max(4, Math.min(9, Math.round(w) + 2));
  const limit = w / 2 + 4;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const mat = (c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0 });
  const TOPS = [0x8f5f66, 0x566a86, 0x86775a, 0x4f6a59, 0x6b6b6b, 0x9a958a, 0x7a5a45];
  const BOTTOMS = [0x1f2125, 0x2a3040, 0x3a2f28, 0x33363b];
  const skin = mat(0xa39688);

  const legGeo = new THREE.CylinderGeometry(0.062, 0.05, 0.84, 10);
  legGeo.translate(0, -0.42, 0); // pivot at the hip
  const armGeo = new THREE.CylinderGeometry(0.042, 0.036, 0.58, 8);
  armGeo.translate(0, -0.29, 0); // pivot at the shoulder
  const torsoGeo = new THREE.CylinderGeometry(0.175, 0.15, 0.6, 14);
  const headGeo = new THREE.SphereGeometry(0.105, 16, 12);

  const reset = (v, fresh) => {
    v.dir = Math.random() < 0.5 ? 1 : -1;
    v.x = fresh ? rnd(-limit, limit) : -v.dir * limit;
    // each visitor keeps to their own lane so they rarely walk through each other
    v.z = d / 2 + 0.55 + (v.lane % 4) * 0.42 + rnd(-0.1, 0.1);
    v.speed = rnd(0.7, 1.15);
    v.stopX = Math.random() < 0.55 ? rnd(-w / 2, w / 2) : null;
    v.mode = 'walk';
    v.wait = 0;
  };

  const visitors = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const top = mat(pick(TOPS));
    const bottom = mat(pick(BOTTOMS));
    const add = (geo, m, x, y, z) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    };
    const legL = add(legGeo, bottom, -0.085, 0.84, 0);
    const legR = add(legGeo, bottom, 0.085, 0.84, 0);
    const torso = add(torsoGeo, top, 0, 1.14, 0);
    torso.scale.z = 0.62; // flatter front to back
    const armL = add(armGeo, top, -0.215, 1.41, 0);
    const armR = add(armGeo, top, 0.215, 1.41, 0);
    add(headGeo, skin, 0, 1.585, 0);
    // what they say while stopped at the booth
    const bubble = makeSpeechBubble(VISITOR_LINES[i % VISITOR_LINES.length], 0.8);
    bubble.position.set(0, 1.78, 0);
    bubble.visible = false;
    g.add(bubble);
    g.scale.setScalar(rnd(0.92, 1.07)); // about 1.55 m to 1.8 m tall
    const v = { g, legL, legR, armL, armR, bubble, phase: rnd(0, 6), yaw: 0, lane: i };
    reset(v, true);
    v.yaw = v.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(g);
    visitors.push(v);
  }

  const tick = (dt) => {
    for (const v of visitors) {
      let targetYaw;
      // most visitors say something while they stop and look
      v.bubble.visible = v.mode === 'look' && v.talk && v.wait > 0.6;
      if (v.mode === 'walk') {
        const before = v.x;
        v.x += v.dir * v.speed * dt;
        v.phase += dt * v.speed * 6.2;
        targetYaw = v.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        if (
          v.stopX !== null &&
          (before - v.stopX) * (v.x - v.stopX) <= 0 // just reached the spot
        ) {
          v.mode = 'look';
          v.talk = Math.random() < 0.7;
          v.wait = rnd(3, 8);
          v.stopX = null;
        }
        if (Math.abs(v.x) > limit) reset(v, false);
      } else {
        v.wait -= dt;
        targetYaw = Math.PI; // face the booth
        if (v.wait <= 0) v.mode = 'walk';
      }
      // turn smoothly, taking the short way round
      let diff = targetYaw - v.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      v.yaw += diff * Math.min(1, dt * 5);
      const stride = v.mode === 'walk' ? Math.sin(v.phase) : 0;
      const ease = Math.min(1, dt * 8);
      v.legL.rotation.x += (stride * 0.5 - v.legL.rotation.x) * ease;
      v.legR.rotation.x += (-stride * 0.5 - v.legR.rotation.x) * ease;
      v.armL.rotation.x += (-stride * 0.35 - v.armL.rotation.x) * ease;
      v.armR.rotation.x += (stride * 0.35 - v.armR.rotation.x) * ease;
      v.g.position.set(v.x, 0, v.z);
      v.g.rotation.y = v.yaw;
    }
  };
  tick(0);
  return { group, tick };
}

/* Brands shown as tabs in the product library. SPEEDRACK is hidden for
   now: put 'SPEEDRACK' back at the front of this list to show it again.
   Its products and builders are untouched, so saved layouts that already
   contain SPEEDRACK items still load and render.                       */
const LIBRARY_BRANDS = ['HOMEDANT HOUSE', 'SPEEDRACK', 'Exhibition'];
/* Products built on the shared frame system (posts, beams, levels you can
   drag, display items): every HOMEDANT HOUSE product and the rebuilt
   SPEEDRACK / MAX 200 ones.                                          */
function isLevelProduct(tpl) {
  return !!tpl && (tpl.brand === 'HOMEDANT HOUSE' || (tpl.brand === 'SPEEDRACK' && !tpl.legacy));
}

/* ----- HOMEDANT HOUSE shelf levels -----
   Each level has its own height and its own style. `h` is in mm from the
   bottom of the posts to the top of the level: the board top in basic
   style, the rim top in basket style. Levels are stored on the product
   as `levels`, with `levelsKey` recording the tier count and height they
   were made for; when either changes the levels fall back to an even
   spread. Beams hook into the post slots, so heights move in slot-pitch
   steps.                                                               */
const HH_LEVEL_TYPES = ['shelf', 'open_base', 'garment', 'rolling', 'pegboard', 'trolley'];
// products that can be dressed with display items
const HH_ITEM_TYPES = ['shelf', 'open_base', 'garment', 'rolling', 'pegboard', 'drawer', 'trolley'];
const HH_DRAWER_TOP = 515; // board over the two drawers of the drawer hanger
const HH_LEVEL_MIN = 112; // lowest level: 50 gap + 53 beam + 9 board
const HH_LEVEL_STEP = 33; // slot pitch
const HH_LEVEL_GAP = 99; // minimum distance between two levels
function hhLevelKey(p) {
  return `${p.tier}-${p.height}`;
}
/* Frame specs. HH is the HOMEDANT HOUSE frame further down; these two
   come from the SPEEDRACK and MAX 200 part files (sizes in metres):
   - SPEEDRACK: single-layer L-angle post 33.6 mm, 1.5 mm steel, keyhole
     slots 13.4 x 19.9 mm every 30 mm on both faces; beam 53 mm with a
     15 mm lip on top, hooked in behind the post faces; L-shaped plastic
     foot 39.6 mm, 20 mm tall. homedant.com lists the SS shelves 12 mm
     wider and deeper than the size name, 11 mm taller (posts stand
     above the top board), with 0.36" (9 mm) boards.
   - MAX 200: C-channel post 42.1 x 45.3 mm, open toward the inside,
     slots 11.3 x 15.4 mm every 30 mm on its front and back faces; 87 mm
     C-beams front and back at the top and bottom levels, steel trays with
     folded edges in between; square plastic foot 51 x 56 mm.          */
const SP_SPEC = {
  kind: 'sp',
  flange: 0.0336,
  postT: 0.0015,
  sheet: 0.0012,
  beamH: 0.053,
  lip: 0.015,
  board: 0.009,
  bottomGap: 0.03,
  levelMin: 92, // 30 gap + 53 beam + 9 board
  step: 30,
  gap: 99,
  topRise: 0.011,
};
const LR_SPEC = {
  kind: 'lr',
  postW: 0.0421,
  postD: 0.0453,
  sheet: 0.0012,
  beamH: 0.087,
  trayLip: 0.035,
  board: 0.002,
  bottomGap: 0.03,
  levelMin: 117, // 30 gap + 87 beam
  step: 30,
  gap: 99,
};
function specOfProduct(p) {
  const id = (p && p.productId) || '';
  if (id.startsWith('sp_')) return SP_SPEC;
  if (id.startsWith('lr_')) return LR_SPEC;
  return HH;
}
function specOf(mat) {
  return mat && mat.userData && mat.userData.hh ? specOfProduct(mat.userData.hh.product) : HH;
}
// level rules (mm) for a product: lowest level, snap step, minimum gap
function levelRule(p) {
  const S = specOfProduct(p);
  return S === HH
    ? { min: HH_LEVEL_MIN, step: HH_LEVEL_STEP, gap: HH_LEVEL_GAP }
    : { min: S.levelMin, step: S.step, gap: S.gap };
}
function hhDefaultLevels(p, tiers) {
  const n = tiers || p.tier || 1;
  const LMIN = levelRule(p).min;
  // drawer hanger: one board over the drawers, one at the top
  if (p.productId === 'hh_drawer')
    return [
      { h: Math.min(HH_DRAWER_TOP, p.height - HH_LEVEL_GAP), style: 'basic' },
      { h: p.height, style: 'basic' },
    ];
  // perforated trolley: trays below, a flat top
  if ((p.productId === 'hh_trolley' || p.productId === 'hh_perf_trolley') && !p.shelfStyle)
    return Array.from({ length: n }, (_, i) => ({
      h: n === 1 ? p.height : Math.round(LMIN + (i / (n - 1)) * (p.height - LMIN)),
      style: i === n - 1 ? 'basic' : 'basket',
    }));
  const style = p.shelfStyle === 'basket' ? 'basket' : 'basic';
  return Array.from({ length: n }, (_, i) => ({
    h:
      n === 1
        ? p.height
        : Math.round(LMIN + (i / (n - 1)) * (p.height - LMIN)),
    style: specOfProduct(p) === HH ? style : 'basic',
  }));
}
/* Tier counts that physically fit the chosen height. Up to 5 tiers are
   always offered (as before); 6 and up need at least 150 mm per opening. */
const TIER_MIN_OPENING = 150;
function tierChoices(tpl, p) {
  return tpl.tierOptions.filter(
    (t) => t <= 5 || (p.height - levelRule(p).min) / (t - 1) >= TIER_MIN_OPENING
  );
}
function fitTier(tpl, p) {
  const ok = tierChoices(tpl, p);
  return ok.includes(p.tier) ? p.tier : Math.max(...ok.filter((t) => t <= p.tier), ok[0]);
}
function hhResolveLevels(p, tiers) {
  const n = tiers || p.tier || 1;
  if (
    Array.isArray(p.levels) &&
    p.levels.length === n &&
    p.levelsKey === hhLevelKey(p)
  )
    return p.levels;
  return hhDefaultLevels(p, n);
}

/* ===== HOMEDANT HOUSE frame =====
   Real construction (from the product renders):
   - Post: an L-angle whose two flanges are each folded back on themselves
     (double layer, rounded safe edge at the tip). The outside is smooth
     with no holes; the paired keyhole slots are on the inner layer only.
   - Beam: a single thin steel plate standing on edge with a narrow lip
     folded inward. Its ends tuck in behind the post flange and hook down
     into the slots, so the beam face sits slightly inside the post face.
   - Board: rests on the lips of the four beams.
   Shelf style:
     'basic'  - lip at the top, board sits on top of the beams
     'basket' - the same beams flipped: lip at the bottom, board drops
                inside the four beams, which become a rim around it
   Sizes in metres. Post thickness, beam lip and board thickness are the
   real figures; flange width, beam height, slot pitch are measured from
   the renders.                                                         */
const HH = {
  flange: 0.036, // width of each post face
  postT: 0.008, // post thickness (two layers + gap)
  sheet: 0.0012, // steel sheet
  beamH: 0.053, // beam plate height (the 2.1" in the product page)
  lip: 0.012, // beam lip folded inward
  slotPitch: 0.033,
  bottomGap: 0.05, // floor to underside of the lowest beam
};

const _hhSlotTexCache = {};
function makeHHSlotTexture(baseHex) {
  if (_hhSlotTexCache[baseHex]) return _hhSlotTexCache[baseHex];
  const W = 64,
    H = 76; // one slot pair per tile (28 mm x 33 mm)
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  const r = (baseHex >> 16) & 0xff,
    g = (baseHex >> 8) & 0xff,
    b = baseHex & 0xff;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, W, H);
  const dark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
  ctx.fillStyle = dark ? '#000000' : '#8f8f92';
  // one slot: a rectangular window that tapers down into a narrow slit.
  // `dir` puts the slit on the inner side so the pair leans together.
  const slot = (x0, dir) => {
    const w = 12,
      top = 6,
      shoulder = 26,
      neck = 36,
      bottom = 58,
      slitW = 2.2;
    const slitX = dir > 0 ? x0 + w - slitW - 2 : x0 + 2;
    ctx.beginPath();
    ctx.moveTo(x0, top);
    ctx.lineTo(x0 + w, top);
    ctx.lineTo(x0 + w, shoulder);
    ctx.lineTo(slitX + slitW, neck);
    ctx.lineTo(slitX + slitW, bottom);
    ctx.lineTo(slitX, bottom);
    ctx.lineTo(slitX, neck);
    ctx.lineTo(x0, shoulder);
    ctx.closePath();
    ctx.fill();
  };
  slot(12, 1);
  slot(32, -1);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  _hhSlotTexCache[baseHex] = tex;
  return tex;
}

function hhAdd(group, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

/* Slot pattern for SPEEDRACK / MAX 200 post faces: one 30 mm pitch per
   tile, the keyholes cut out (transparent) so you can see through them.
   `fromRight`: the post corner is on the right edge of the face.      */
const _frameSlotTex = {};
function frameSlotTexture(kind, fromRight) {
  const key = kind + (fromRight ? 'R' : 'L');
  if (_frameSlotTex[key]) return _frameSlotTex[key];
  const sp = kind === 'sp';
  const PX = 4; // px per mm
  const faceW = sp ? 33.6 : 42.1,
    pitch = 30;
  const cv = document.createElement('canvas');
  cv.width = Math.round(faceW * PX);
  cv.height = pitch * PX;
  const x = cv.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, cv.width, cv.height);
  const sw = sp ? 13.4 : 11.3,
    sh = sp ? 19.9 : 15.4,
    bottom = sp ? 4.8 : 8.3;
  // SPEEDRACK slots sit 20.6 mm from the corner; MAX 200 ones are centred
  const cu = sp ? (fromRight ? faceW - 20.6 : 20.6) : faceW / 2;
  const P = (u, z) => [u * PX, (pitch - z) * PX];
  const top = bottom + sh,
    wide = sw / 2,
    neck = sw * 0.29,
    shoulder = top - sh * 0.42,
    waist = shoulder - sh * 0.16;
  x.globalCompositeOperation = 'destination-out';
  x.beginPath();
  x.moveTo(...P(cu - wide, top));
  x.lineTo(...P(cu + wide, top));
  x.lineTo(...P(cu + wide, shoulder));
  x.lineTo(...P(cu + neck, waist));
  x.lineTo(...P(cu + neck, bottom));
  x.lineTo(...P(cu - neck, bottom));
  x.lineTo(...P(cu - neck, waist));
  x.lineTo(...P(cu - wide, shoulder));
  x.closePath();
  x.fill();
  x.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  _frameSlotTex[key] = tex;
  return tex;
}
function slottedFaceMat(frameMat, kind, fromRight, height) {
  const tex = frameSlotTexture(kind, fromRight).clone();
  tex.needsUpdate = true;
  tex.repeat.set(1, height / 0.03);
  return new THREE.MeshStandardMaterial({
    color: frameMat.color.getHex(),
    map: tex,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    metalness: frameMat.metalness,
    roughness: frameMat.roughness,
  });
}
const CORNERS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];
// SPEEDRACK: open L-angle, one layer of steel, slots on both faces
function addSPPosts(group, w, d, h, frameMat) {
  const F = SP_SPEC.flange;
  const H = h + SP_SPEC.topRise; // posts stand a little above the top board
  const mL = slottedFaceMat(frameMat, 'sp', false, H),
    mR = slottedFaceMat(frameMat, 'sp', true, H);
  const face = new THREE.PlaneGeometry(F, H);
  CORNERS.forEach(([sx, sz]) => {
    const ex = sx * (w / 2),
      ez = sz * (d / 2);
    hhAdd(group, face, sx > 0 ? mR : mL, ex - sx * (F / 2), H / 2, ez - sz * 0.0008);
    const side = hhAdd(group, face, sz > 0 ? mR : mL, ex - sx * 0.0008, H / 2, ez - sz * (F / 2));
    side.rotation.y = -Math.PI / 2;
  });
}
// MAX 200: C-channel, closed on the outside, open toward the shelf
function addLRPosts(group, w, d, h, frameMat) {
  const { postW: PW, postD: PD, sheet: t } = LR_SPEC;
  const faceMat = slottedFaceMat(frameMat, 'lr', false, h);
  const face = new THREE.PlaneGeometry(PW, h);
  const outer = new THREE.BoxGeometry(t, h, PD);
  const lipW = 0.008;
  const lip = new THREE.BoxGeometry(t, h, lipW);
  CORNERS.forEach(([sx, sz]) => {
    const ex = sx * (w / 2),
      ez = sz * (d / 2);
    hhAdd(group, outer, frameMat, ex - sx * (t / 2), h / 2, ez - sz * (PD / 2));
    hhAdd(group, face, faceMat, ex - sx * (PW / 2), h / 2, ez - sz * 0.0006);
    hhAdd(group, face, faceMat, ex - sx * (PW / 2), h / 2, ez - sz * (PD - 0.0006));
    hhAdd(group, lip, frameMat, ex - sx * (PW - t / 2), h / 2, ez - sz * (lipW / 2 + 0.0006));
    hhAdd(group, lip, frameMat, ex - sx * (PW - t / 2), h / 2, ez - sz * (PD - lipW / 2 - 0.0006));
  });
}
function plasticOf(frameMat) {
  const hex = frameMat.color.getHex();
  const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, metalness: 0 });
  if (isLightHex(hex)) m.color.multiplyScalar(0.9);
  return m;
}
// SPEEDRACK foot (안전좌): an L-shaped plastic cap around the post bottom
function addSPFeet(group, w, d, frameMat) {
  const m = plasticOf(frameMat);
  const L = 0.0396,
    H = 0.02,
    T = 0.003;
  const gx = new THREE.BoxGeometry(L, H, T),
    gz = new THREE.BoxGeometry(T, H, L),
    pad = new THREE.BoxGeometry(L * 0.62, 0.004, L * 0.62);
  CORNERS.forEach(([sx, sz]) => {
    const ex = sx * (w / 2),
      ez = sz * (d / 2);
    hhAdd(group, gx, m, ex - sx * (L / 2), H / 2, ez - sz * (T / 2));
    hhAdd(group, gz, m, ex - sx * (T / 2), H / 2, ez - sz * (L / 2));
    hhAdd(group, pad, m, ex - sx * (L * 0.31), 0.002, ez - sz * (L * 0.31));
  });
}
// MAX 200 foot: a square plastic cap the post stands in
function addLRFeet(group, w, d, frameMat) {
  const m = plasticOf(frameMat);
  const { postW: PW, postD: PD } = LR_SPEC;
  const g = new THREE.BoxGeometry(PW + 0.009, 0.024, PD + 0.011);
  CORNERS.forEach(([sx, sz]) => {
    hhAdd(group, g, m, sx * (w / 2 - PW / 2), 0.012, sz * (d / 2 - PD / 2));
  });
}
/* MAX 200 level. Top and bottom levels: 87 mm C-beams front and back
   with a steel deck between them. Levels in between: a steel tray with
   its front and back edges folded down, on depth supports at the sides. */
function addLRLevel(group, w, d, yBoard, frameMat, thickness) {
  const { postW: PW, sheet: t, beamH: BH, trayLip: TL } = LR_SPEC;
  const cur = frameMat.userData.hh.cur || { i: 0, n: 1 };
  const top = yBoard + thickness / 2;
  const wi = w - 2 * PW; // between the posts
  const hex = frameMat.color.getHex();
  const deckTop = frameMat.clone();
  if (isLightHex(hex)) deckTop.color.setHex(hex).multiplyScalar(0.86);
  const deckMat = [frameMat, frameMat, deckTop, frameMat, frameMat, frameMat];
  const isEnd = cur.i === 0 || cur.i === cur.n - 1;
  if (isEnd) {
    const D = 0.0104; // beam depth
    [-1, 1].forEach((s) => {
      const z = s * (d / 2);
      hhAdd(group, new THREE.BoxGeometry(wi, BH, t), frameMat, 0, top - BH / 2, z - s * (t / 2));
      hhAdd(group, new THREE.BoxGeometry(wi, t, D), frameMat, 0, top - t / 2, z - s * (D / 2));
      hhAdd(group, new THREE.BoxGeometry(wi, t, D), frameMat, 0, top - BH + t / 2, z - s * (D / 2));
      hhAdd(group, new THREE.BoxGeometry(wi, 0.006, t), frameMat, 0, top - BH + 0.004, z - s * (D - t / 2));
    });
    hhAdd(group, new THREE.BoxGeometry(wi - 0.002, 0.0015, d - 2 * D), deckMat, 0, top - 0.00075, 0);
  } else {
    hhAdd(group, new THREE.BoxGeometry(wi - 0.002, 0.0015, d - 0.003), deckMat, 0, top - 0.00075, 0);
    [-1, 1].forEach((s) => {
      hhAdd(group, new THREE.BoxGeometry(wi - 0.002, TL, t), frameMat, 0, top - TL / 2, s * (d / 2 - 0.0015 - t / 2));
      hhAdd(group, new THREE.BoxGeometry(wi - 0.002, t, 0.008), frameMat, 0, top - TL + t / 2, s * (d / 2 - 0.0055));
      // depth support under the tray at each side
      hhAdd(group, new THREE.BoxGeometry(t, 0.025, d - 0.01), frameMat, s * (wi / 2 - 0.0015), top - 0.0015 - 0.0125, 0);
      hhAdd(group, new THREE.BoxGeometry(0.02, t, d - 0.01), frameMat, s * (wi / 2 - 0.011), top - 0.0015 - 0.025, 0);
    });
  }
}

function addHHPosts(group, w, d, h, frameMat) {
  const S = specOf(frameMat);
  if (S.kind === 'sp') return addSPPosts(group, w, d, h, frameMat);
  if (S.kind === 'lr') return addLRPosts(group, w, d, h, frameMat);
  const { flange: F, postT: T, sheet: t } = HH;
  const slotMat = frameMat.userData.hh.slotMat;
  slotMat.map.repeat.set(1, h / HH.slotPitch);
  const innerW = F - T; // inner layer runs from the tip to the other flange
  const outerX = new THREE.BoxGeometry(F, h, t);
  const outerZ = new THREE.BoxGeometry(t, h, F);
  const innerX = new THREE.BoxGeometry(innerW, h, t);
  const innerZ = new THREE.BoxGeometry(t, h, innerW);
  const hem = new THREE.CylinderGeometry(T / 2, T / 2, h, 10);
  // safety cap: a plastic L sleeve over the post top, in the frame colour.
  // Its top face is toned down so a light colour doesn't burn out to white
  // under the top light (same trick as the boards).
  const CAP_H = 0.016,
    CAP_E = 0.0012; // sits a hair proud of the post
  const capX = new THREE.BoxGeometry(F + CAP_E, CAP_H, T + CAP_E);
  const capZ = new THREE.BoxGeometry(T + CAP_E, CAP_H, F - T);
  const capHex = frameMat.color.getHex();
  const capLight = isLightHex(capHex);
  const capSide = new THREE.MeshStandardMaterial({
    color: capHex,
    roughness: frameMat.roughness,
    metalness: frameMat.metalness,
  });
  capSide.color.multiplyScalar(capLight ? 0.88 : 1);
  const capTop = capSide.clone();
  capTop.color.setHex(capHex).multiplyScalar(capLight ? 0.7 : 1);
  const capMat = [capSide, capSide, capTop, capSide, capSide, capSide];
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz]) => {
    const ex = sx * (w / 2), // outer corner
      ez = sz * (d / 2);
    // outer skin: smooth, no holes
    hhAdd(group, outerX, frameMat, ex - sx * (F / 2), h / 2, ez - sz * (t / 2));
    hhAdd(group, outerZ, frameMat, ex - sx * (t / 2), h / 2, ez - sz * (F / 2));
    // inner layer: carries the slots, faces the inside of the shelf
    hhAdd(
      group,
      innerX,
      slotMat,
      ex - sx * (F - innerW / 2),
      h / 2,
      ez - sz * (T - t / 2)
    );
    hhAdd(
      group,
      innerZ,
      slotMat,
      ex - sx * (T - t / 2),
      h / 2,
      ez - sz * (F - innerW / 2)
    );
    // rounded fold at each flange tip
    hhAdd(group, hem, frameMat, ex - sx * F, h / 2, ez - sz * (T / 2));
    hhAdd(group, hem, frameMat, ex - sx * (T / 2), h / 2, ez - sz * F);
    // top cap closing the L
    const capY = h + HH_CAP_RISE * MM_TO_M - CAP_H / 2; // top of the cap 11 mm above the frame
    hhAdd(group, capX, capMat, ex - sx * (F / 2), capY, ez - sz * (T / 2));
    hhAdd(group, capZ, capMat, ex - sx * (T / 2), capY, ez - sz * (T + (F - T) / 2));
  });
}

function addHHFeet(group, w, d, footMat) {
  const S = specOf(footMat);
  if (S.kind === 'sp') return addSPFeet(group, w, d, footMat);
  if (S.kind === 'lr') return addLRFeet(group, w, d, footMat);
  const { flange: F, postT: T } = HH;
  const fh = 0.006;
  const gx = new THREE.BoxGeometry(F + 0.001, fh, T + 0.001);
  const gz = new THREE.BoxGeometry(T + 0.001, fh, F - T);
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz]) => {
    const ex = sx * (w / 2),
      ez = sz * (d / 2);
    hhAdd(group, gx, footMat, ex - sx * (F / 2), fh / 2, ez - sz * (T / 2));
    hhAdd(group, gz, footMat, ex - sx * (T / 2), fh / 2, ez - sz * (T + (F - T) / 2));
  });
}

/* One shelf level. `yBoard` is where the board centre sits in the basic
   style; the basket style keeps the level at the same height but flips
   the beams, so the rim top lands where the board top was.            */
function addHHLevel(group, w, d, yBoard, boardMat, frameMat, thickness, style, perfH = 0, perfUp = false) {
  const S = specOf(frameMat);
  if (S.kind === 'lr') return addLRLevel(group, w, d, yBoard, frameMat, thickness);
  const { flange: F, postT: T, sheet: t, beamH: BH, lip: LIP } = S;
  const basket = S === HH && (style || frameMat.userData.hh.style) === 'basket';
  const beamTop = basket ? yBoard + thickness / 2 : yBoard - thickness / 2;
  const beamMid = beamTop - BH / 2;
  const lipY = basket ? beamTop - BH + t / 2 : beamTop - t / 2;
  // perforated beam (back and both ends): the same folded plate as an
  // ordinary beam, only taller: hanging down from the board, or (trolley)
  // rising from the beam's bottom edge
  if (perfH > BH) {
    const yc = perfUp ? beamTop - BH + perfH / 2 : beamTop - perfH / 2;
    const lenX = w - 2 * T,
      lenZ = d - 2 * T - 2 * t;
    const hex = frameMat.color.getHex();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(lenX, perfH), hhPerfMaterial(lenX, perfH, hex, !perfUp));
    back.position.set(0, yc, -(d / 2 - T - t / 2));
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);
    [-1, 1].forEach((sx) => {
      const end = new THREE.Mesh(new THREE.PlaneGeometry(lenZ, perfH), hhPerfMaterial(lenZ, perfH, hex, !perfUp));
      end.rotation.y = Math.PI / 2;
      end.position.set(sx * (w / 2 - T - t / 2), yc, 0);
      end.castShadow = true;
      end.receiveShadow = true;
      group.add(end);
    });
  }

  const lenX = w - 2 * T; // front/back plates, ends tucked behind the posts
  const lenZ = d - 2 * T - 2 * t; // side plates fit between them
  const plateX = new THREE.BoxGeometry(lenX, BH, t);
  const plateZ = new THREE.BoxGeometry(t, BH, lenZ);
  const lipX = new THREE.BoxGeometry(lenX - 2 * LIP - 0.03, t, LIP);
  const lipZ = new THREE.BoxGeometry(LIP, t, lenZ - 2 * LIP - 0.03);
  const zPlate = d / 2 - T - t / 2;
  const xPlate = w / 2 - T - t / 2;
  // the two hook rivets visible on the beam face next to each post
  const rivetX = new THREE.CylinderGeometry(0.0026, 0.0026, 0.0016, 10);
  rivetX.rotateX(Math.PI / 2);
  const rivetZ = new THREE.CylinderGeometry(0.0026, 0.0026, 0.0016, 10);
  rivetZ.rotateZ(Math.PI / 2);

  [-1, 1].forEach((s) => {
    // with a perforated beam only the front plate stays solid
    if (!(perfH > BH && s < 0)) hhAdd(group, plateX, frameMat, 0, beamMid, s * zPlate);
    hhAdd(group, lipX, frameMat, 0, lipY, s * (zPlate - t / 2 - LIP / 2));
    if (!(perfH > BH)) hhAdd(group, plateZ, frameMat, s * xPlate, beamMid, 0);
    hhAdd(group, lipZ, frameMat, s * (xPlate - t / 2 - LIP / 2), lipY, 0);
    [-1, 1].forEach((e) => {
      [-0.015, 0.015].forEach((dy) => {
        hhAdd(
          group,
          rivetX,
          frameMat,
          e * (w / 2 - F - 0.008),
          beamMid + dy,
          s * (zPlate + t / 2)
        );
        hhAdd(
          group,
          rivetZ,
          frameMat,
          s * (xPlate + t / 2),
          beamMid + dy,
          e * (d / 2 - F - 0.008)
        );
      });
    });
  });

  // board: on top of the lips (basic) or dropped inside the beams (basket)
  const gap = basket ? 2 * t + 0.002 : 0;
  const bw = w - 2 * T - gap;
  const bd = d - 2 * T - gap;
  const by = basket ? beamTop - BH + t + thickness / 2 : yBoard;
  const board = new THREE.Mesh(
    makeBoardGeometry(bw, thickness, bd, yBoard),
    (boardMat.userData && boardMat.userData.faceMats) || boardMat
  );
  board.position.set(0, by, 0);
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);
}

/* opts: { perforated: bool }  ── perforated => SPEEDRACK only
   (HOMEDANT HOUSE uses smooth posts, no slot pattern.)
   If perforated, a separate `postMat` is returned with a clone of the
   slot texture so its UV repeat can be set per post-height in addPosts. */
function makeMaterials(p, opts = {}) {
  const frameHex = frameHexOf(p.frameColor);
  const boardHex = BOARD_COLORS[p.boardColor] || 0xb89968;
  // light paint colours (white, oat...) get the matte white-paint finish
  const isWhiteFrame = p.frameColor === 'white' || isLightHex(frameHex);
  const isWhiteBoard = p.boardColor === 'white';

  // White paint: low metalness + higher roughness so directional light
  // creates visible shading instead of a perfectly flat white blob.
  const frame = new THREE.MeshStandardMaterial({
    color: frameHex,
    metalness: isWhiteFrame ? 0.08 : 0.35,
    roughness: isWhiteFrame ? 0.62 : 0.55,
  });
  const board = new THREE.MeshStandardMaterial({
    color: boardHex,
    metalness: 0.05,
    roughness: isWhiteBoard ? 0.78 : 0.7,
  });
  /* Double-sided board: one face wood, the other white. Two edges are
     wood-banded (one long, one short, meeting at a corner) and the other
     two are white. The board is laid so the two edges in view (front and
     right, as the default camera sees them) match the face that is up:
       'wood'  -> wood up, white underneath, wood on the front + right edge
       'white' -> white up, wood underneath, white on the front + right
                  edge (wood corner turned to the back left)
     `board` stays the up-face material (used on its own by cabinet tops
     etc.); the per-face set lives in board.userData.faceMats and is used
     by addBoardWithBeams.                                               */
  if (p.boardColor === 'wood' || p.boardColor === 'white') {
    const woodMap = makeWoodTexture().clone();
    const mk = (color, map) =>
      new THREE.MeshStandardMaterial({
        color,
        map: map || null,
        metalness: 0,
        roughness: 0.8,
      });
    const woodSide = mk(0xffffff, woodMap); // wood edges + wood underside
    const whiteSide = mk(WHITE_SIDE); // white edges + white underside
    // undersides only get ambient light; a little self-glow keeps the
    // white face reading as white instead of mid-grey
    whiteSide.emissive.set(0x2a2a2a);
    const woodUp = p.boardColor === 'wood';
    // `board` itself is the up-facing face
    board.metalness = 0;
    board.roughness = 0.8;
    if (woodUp) {
      board.map = woodMap;
      board.color.set(WOOD_TOP_TINT);
    } else {
      board.color.set(WHITE_TOP);
    }
    board.userData.faceMats = [
      woodUp ? woodSide : whiteSide, // +x (right edge)
      woodUp ? whiteSide : woodSide, // -x (left edge)
      board, // top
      woodUp ? whiteSide : woodSide, // bottom
      woodUp ? woodSide : whiteSide, // +z (front edge)
      woodUp ? whiteSide : woodSide, // -z (back edge)
    ];
  }
  // painted steel deck in the frame colour; the up face is toned down
  // like the wooden boards so it doesn't wash out under the top light
  if (p.boardColor === 'steel') {
    board.color.setHex(frameHex);
    board.metalness = isWhiteFrame ? 0.08 : 0.3;
    board.roughness = 0.6;
    const top = board.clone();
    top.color.setHex(frameHex).multiplyScalar(0.72);
    board.userData.faceMats = [board, board, top, board, board, board];
  }
  const foot = new THREE.MeshStandardMaterial({
    // Cap color matches frame: white frame → white cap, black frame → black cap.
    // Slightly matte plastic finish so the cap is distinguishable from the
    // post material when looked at closely, but it never reads as a separate
    // black "shoe" on a white-framed product.
    color: frameHex,
    metalness: 0.05,
    roughness: 0.85,
  });

  let postMat = frame;
  if (opts.perforated) {
    const baseTex = makeSlotPostTexture(frameHex);
    const tex = baseTex.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex,
      metalness: isWhiteFrame ? 0.1 : 0.2,
      roughness: isWhiteFrame ? 0.62 : 0.55,
    });
  }
  if (opts.house) {
    const slotTex = makeHHSlotTexture(frameHex).clone();
    slotTex.needsUpdate = true;
    const slotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: slotTex,
      metalness: frame.metalness,
      roughness: frame.roughness,
    });
    const hhInfo = {
      style: p.shelfStyle === 'basket' ? 'basket' : 'basic',
      slotMat,
      product: p,
    };
    frame.userData.hh = hhInfo;
    foot.userData.hh = hhInfo;
  }
  return { frame, board, foot, postMat, frameHex };
}

/* Posts run from y=0 to y=h.
   - SPEEDRACK (opts.perforated + opts.postMat with a hole map):
       built as an L-shaped angle-steel profile (two thin flanges) with
       the punched-hole texture on the visible faces.
   - HOMEDANT HOUSE (no postMat map): a simple square box post.
   The L is oriented so its corner points toward the booth interior's
   outer corner, i.e. the two flanges face outward — exactly how angle
   posts sit on a real rack.                                            */
function addPosts(group, w, d, h, mat, postSize = 0.025, opts = {}) {
  if (mat.userData && mat.userData.hh) {
    addHHPosts(group, w, d, h, mat);
    return;
  }
  const postMat = opts.postMat || mat;
  const isAngle = !!(opts.postMat && opts.postMat.map);

  // vertical UV repeat for the hole texture (1 hole-pair per ~50mm)
  if (postMat.map) {
    postMat.map.repeat.set(1, Math.max(3, Math.round(h * 20)));
    postMat.map.needsUpdate = true;
  }

  // four corner positions + which way the L-corner faces (sign of x,z)
  const corners = [
    { x: -w / 2 + postSize / 2, z: -d / 2 + postSize / 2, sx: -1, sz: -1 },
    { x: w / 2 - postSize / 2, z: -d / 2 + postSize / 2, sx: 1, sz: -1 },
    { x: -w / 2 + postSize / 2, z: d / 2 - postSize / 2, sx: -1, sz: 1 },
    { x: w / 2 - postSize / 2, z: d / 2 - postSize / 2, sx: 1, sz: 1 },
  ];

  if (isAngle) {
    // L-profile: two thin flanges. flangeT = steel thickness (thin!),
    // flangeW = how wide each leg of the L is.
    const flangeT = postSize * 0.3;
    const flangeW = postSize;
    const legGeoX = new THREE.BoxGeometry(flangeW, h, flangeT); // runs along x
    const legGeoZ = new THREE.BoxGeometry(flangeT, h, flangeW); // runs along z
    corners.forEach((c) => {
      // leg A: lies along X, pushed to the outer Z edge
      const a = new THREE.Mesh(legGeoX, postMat);
      a.position.set(c.x, h / 2, c.z + c.sz * (postSize / 2 - flangeT / 2));
      a.castShadow = true;
      a.receiveShadow = true;
      group.add(a);
      // leg B: lies along Z, pushed to the outer X edge
      const b = new THREE.Mesh(legGeoZ, postMat);
      b.position.set(c.x + c.sx * (postSize / 2 - flangeT / 2), h / 2, c.z);
      b.castShadow = true;
      b.receiveShadow = true;
      group.add(b);
    });
  } else {
    // HOMEDANT HOUSE — smooth square post, no holes
    const geo = new THREE.BoxGeometry(postSize, h, postSize);
    corners.forEach((c) => {
      const m = new THREE.Mesh(geo, postMat);
      m.position.set(c.x, h / 2, c.z);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    });
  }
}

/* Post end-cap — a flush plastic cap that sits at the very bottom of each
   post. Same cross-section as the post (no protrusion beyond the post
   silhouette), and the same color as the frame (set in makeMaterials).
   8 mm tall — visible as a thin sleeve when zoomed in, invisible from a
   distance, exactly like real shelving caps.                            */
function addPostFeet(group, w, d, footMat, postSize = 0.025) {
  if (footMat.userData && footMat.userData.hh) {
    addHHFeet(group, w, d, footMat);
    return;
  }
  const footW = postSize; // flush fit — matches post width
  const footH = 0.008; // 8 mm — thin sleeve
  const footD = postSize; // flush fit — matches post depth
  const geo = new THREE.BoxGeometry(footW, footH, footD);
  const positions = [
    [-w / 2 + postSize / 2, footH / 2, -d / 2 + postSize / 2],
    [w / 2 - postSize / 2, footH / 2, -d / 2 + postSize / 2],
    [-w / 2 + postSize / 2, footH / 2, d / 2 - postSize / 2],
    [w / 2 - postSize / 2, footH / 2, d / 2 - postSize / 2],
  ];
  positions.forEach((p) => {
    const m = new THREE.Mesh(geo, footMat);
    m.position.set(p[0], p[1], p[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  });
}

/* ── Render ONE shelf level: 4 perimeter support beams + board on top.
   The beams form the metal frame the board physically rests on. This is
   the most visually-defining structural element of every shelf product.
   Beam top = board bottom, beam outer face aligned with the board edge,
   so from outside you see the beam as a horizontal "lip" beneath the
   board. */
function addBoardWithBeams(
  group,
  w,
  d,
  yBoardCenter,
  boardMat,
  frameMat,
  opts = {}
) {
  const {
    postSize = 0.025,
    thickness = 0.009,
    beamH = 0.03,
    beamW = 0.018,
  } = opts;

  if (frameMat.userData && frameMat.userData.hh) {
    addHHLevel(
      group,
      w,
      d,
      yBoardCenter,
      boardMat,
      frameMat,
      thickness,
      opts.hhStyle,
      opts.hhPerf || 0,
      !!opts.hhPerfUp
    );
    return;
  }

  const boardW = w - postSize * 2;
  const boardD = d - postSize * 2;
  // beam center y: directly below the board
  const yLevel = yBoardCenter - thickness / 2 - beamH / 2;

  // Front + back beams span the full inner width
  const fbGeo = new THREE.BoxGeometry(boardW, beamH, beamW);
  // Left + right beams span what's left between the front/back beams,
  // so the corners meet flush instead of overlapping
  const lrGeo = new THREE.BoxGeometry(beamW, beamH, boardD - beamW * 2);

  const zFront = d / 2 - postSize - beamW / 2;
  const zBack = -d / 2 + postSize + beamW / 2;
  const xLeft = -w / 2 + postSize + beamW / 2;
  const xRight = w / 2 - postSize - beamW / 2;

  const beams = [
    [0, yLevel, zFront, fbGeo],
    [0, yLevel, zBack, fbGeo],
    [xLeft, yLevel, 0, lrGeo],
    [xRight, yLevel, 0, lrGeo],
  ];
  for (const [bx, by, bz, geo] of beams) {
    const m = new THREE.Mesh(geo, frameMat);
    m.position.set(bx, by, bz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }

  // Board sits ON TOP of the 4 beams
  const boardGeo = makeBoardGeometry(boardW, thickness, boardD, yBoardCenter);
  const board = new THREE.Mesh(
    boardGeo,
    (boardMat.userData && boardMat.userData.faceMats) || boardMat
  );
  board.position.set(0, yBoardCenter, 0);
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);
}

function addTierBoards(group, w, d, h, tiers, boardMat, opts = {}) {
  let {
    skipBottom = false,
    postSize = 0.025,
    thickness = 0.009,
    bottomLift = 0.008,
    beamH = 0.03,
    beamW = 0.018,
    frameMat = boardMat,
  } = opts;
  // Bottom board top = bottomLift + beamH + thickness  (just above foot caps)
  // Top board top   = h
  const isHH = !!(frameMat.userData && frameMat.userData.hh);
  const S = isHH ? specOf(frameMat) : null;
  if (S && S.board) thickness = S.board;
  const yBoardBottom = isHH
    ? S.bottomGap + S.beamH + thickness / 2
    : bottomLift + beamH + thickness / 2;
  const yBoardTop = h - thickness / 2;
  const start = skipBottom ? 1 : 0;
  // HOMEDANT HOUSE: every level carries its own height and style
  const hhLevels = isHH
    ? hhResolveLevels(frameMat.userData.hh.product, tiers)
    : null;
  for (let i = start; i < tiers; i++) {
    let y;
    if (tiers === 1) y = yBoardTop;
    else if (i === 0) y = yBoardBottom;
    else y = yBoardBottom + (i / (tiers - 1)) * (yBoardTop - yBoardBottom);
    if (hhLevels) y = hhLevels[i].h * MM_TO_M - thickness / 2;
    if (isHH) frameMat.userData.hh.cur = { i, n: tiers };
    const before = group.children.length;
    addBoardWithBeams(group, w, d, y, boardMat, frameMat, {
      postSize,
      thickness,
      beamH,
      beamW,
      hhStyle: hhLevels ? hhLevels[i].style : undefined,
      hhPerf: isHH && frameMat.userData.hh.perf ? frameMat.userData.hh.perf[i] || 0 : 0,
      hhPerfUp: isHH && !!frameMat.userData.hh.perfUp,
    });
    if (hhLevels) for (let k = before; k < group.children.length; k++) group.children[k].userData.hhLevel = i;
    const hh = isHH ? frameMat.userData.hh : null;
    if (hhLevels && hh.product.showItems) {
      // dress the level: work out its board surface and the room above it
      const L = hhLevels[i];
      const basket = L.style === 'basket';
      const top = basket
        ? L.h * MM_TO_M - S.beamH + S.sheet + thickness
        : L.h * MM_TO_M;
      let clear = 0.42; // top level: open above
      if (i < tiers - 1) {
        const N = hhLevels[i + 1];
        const nextBeamBottom =
          N.h * MM_TO_M - S.beamH - (N.style === 'basket' ? 0 : thickness);
        clear = nextBeamBottom - top - 0.015;
      }
      // under a hanger bar the clothes need most of the height
      if (hh.barLevels && hh.barLevels.includes(i + 1)) clear *= 0.3;
      addDisplayItems(
        group,
        w,
        d,
        top,
        Math.min(clear, 0.75),
        hashSeed(hh.product.instanceId || 'item') + i * 977,
        basket ? 0.012 : 0,
        hh.product.itemPicks ? hh.product.itemPicks[i] : null
      );
    }
  }
}

function buildShelf(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK' && !isLevelProduct(tpl);
  const mats = makeMaterials(p, {
    perforated,
    house: isLevelProduct(tpl),
  });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  const skipBottom = tpl.type === 'open_base';
  addTierBoards(group, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    skipBottom,
    frameMat: mats.frame,
  });
  if (skipBottom && mats.frame.userData.hh && p.showItems && p.baseItem === 'washer')
    addWasher(group, w, d, hhOpenBaseRoom(p, hhResolveLevels(p, p.tier || tpl.defaultTier)));
  addPostFeet(group, w, d, mats.foot, 0.025);
}

/* ===== display items =====
   Everyday things placed on the shelves so a booth reads as a dressed
   display instead of bare shelving: boxes, baskets, books, jars, plants,
   towels and a suitcase, plus clothes on the hanger bar. What goes where
   is picked from a random sequence seeded by the product's id and the
   level, so a shelf keeps the same items every time it is redrawn.     */
function hashSeed(str) {
  let h = 2166136261;
  for (const ch of String(str)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function displayKit(group, seed) {
  const rng = makeRng(seed);
  const R = (a, b) => a + rng() * (b - a);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const mat = (c, rough = 0.85) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 });
  const put = (parent, geo, m, x, y, z) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const sub = (x, y, z, turn = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = turn;
    group.add(g);
    return g;
  };
  return { rng, R, pick, mat, put, sub };
}

/* ----- real prop models -----
   Photo-scanned style models (Poly Haven, CC0) for the display items,
   kept in ./propModels.js and fetched in the background after the page
   has loaded. Until they arrive, and for item types that have no model
   (jars, towels, flat books), the simple shapes below are used.
   PROP_MODELS[name] = { scene, size } with the model centred on x/z and
   standing on y = 0. Instances are clones that share the cached geometry
   and materials, marked sharedAsset so product clean-up leaves them be. */
const PROP_MODELS = {};
const FRAME_TURN = -Math.PI / 2; // the frame models face along x
let _propLoad = null;
function loadPropModels() {
  if (_propLoad) return _propLoad;
  _propLoad = import('./propModels.js')
    .then((mod) => {
      const loader = new GLTFLoader();
      const jobs = Object.entries(mod.default).map(
        ([name, b64]) =>
          new Promise((resolve) => {
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            loader.parse(
              bytes.buffer,
              '',
              (gltf) => {
                const scene = gltf.scene;
                scene.updateMatrixWorld(true);
                const box = new THREE.Box3().setFromObject(scene);
                const size = box.getSize(new THREE.Vector3());
                const holder = new THREE.Group();
                scene.position.set(
                  -(box.min.x + box.max.x) / 2,
                  -box.min.y,
                  -(box.min.z + box.max.z) / 2
                );
                holder.add(scene);
                holder.traverse((o) => {
                  o.userData.sharedAsset = true;
                  if (!o.isMesh) return;
                  o.castShadow = true;
                  o.receiveShadow = true;
                  const m = o.material;
                  if (m.transparent) {
                    o.visible = false; // glass pane: reads as a grey film here
                    return;
                  }
                  if (m.map) {
                    // this app does not colour-manage, so use the texture
                    // values as they are, like every other texture here
                    m.map.encoding = THREE.LinearEncoding;
                    m.map.needsUpdate = true;
                  }
                  m.color.multiplyScalar(0.88); // scene lights run bright
                  m.metalness = 0;
                  m.needsUpdate = true;
                });
                PROP_MODELS[name] = { scene: holder, size };
                resolve();
              },
              () => resolve() // a model that fails just keeps its simple shape
            );
          })
      );
      return Promise.all(jobs).then(() => true);
    })
    .catch(() => false);
  return _propLoad;
}
/* Put a model in group g so it fits maxW x maxD x maxH, turning it a
   quarter turn if that fits better. Returns false if there is no such
   model yet or it would have to shrink below minScale.                */
function placePropModel(g, name, maxW, maxD, maxH, turn = 0, minScale = 0.5, maxScale = 1) {
  const m = PROP_MODELS[name];
  if (!m) return false;
  const fit = (sx, sz) => Math.min(maxScale, maxW / sx, maxD / sz, maxH / m.size.y);
  const straight = fit(m.size.x, m.size.z);
  const turned = fit(m.size.z, m.size.x);
  const s = Math.max(straight, turned);
  if (s < minScale) return false;
  const obj = m.scene.clone(true);
  obj.scale.setScalar(s);
  obj.rotation.y = (turned > straight ? Math.PI / 2 : 0) + turn;
  g.add(obj);
  return true;
}

/* Item types the user can pick for a slot, with the free height each
   needs at full size. A picked item that is a little too tall for its
   level is scaled down to fit; one that is far too tall is left out.   */
const DISPLAY_ITEMS = [
  ['box', 'Box', 0.1],
  ['basket', 'Basket', 0.1],
  ['booksUp', 'Books', 0.3],
  ['booksFlat', 'Books (flat)', 0.08],
  ['jars', 'Jars', 0.22],
  ['plant', 'Plant', 0.42],
  ['vase', 'Vase', 0.3],
  ['towels', 'Towels', 0.08],
  ['ball', 'Soccer ball', 0.24],
  ['suitcase', 'Suitcase', 0.64],
  ['frame', 'Picture frame', 0.29],
  ['fruit', 'Fruit bowl', 0.2],
  ['cans', 'Canned food', 0.14],
  ['snacks', 'Snack boxes', 0.28],
  ['laptop', 'Laptop', 0.25],
  ['tv', 'TV', 0.4],
];

/* Printed faces for the cans and snack boxes: made-up generic packaging,
   drawn once and shared by every item that uses it.                    */
const _labelTex = {};
function labelTexture(key, w, h, draw) {
  if (_labelTex[key]) return _labelTex[key];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  _labelTex[key] = t;
  return t;
}
/* what a TV or laptop shows: a calm blue-grey picture, lit from within */
function screenTexture() {
  return labelTexture('screen', 256, 144, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#2b4a63');
    g.addColorStop(0.55, '#5f8296');
    g.addColorStop(1, '#c9b79a');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(20,34,46,0.55)';
    x.beginPath();
    x.moveTo(0, h);
    x.lineTo(0, h * 0.7);
    x.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.55, h * 0.72);
    x.quadraticCurveTo(w * 0.8, h * 0.92, w, h * 0.66);
    x.lineTo(w, h);
    x.fill();
  });
}
// name, label colour, band colour, picture colour
const CAN_KINDS = [
  ['TOMATO', '#a63628', '#eadfc8', '#c6452f'],
  ['SWEET CORN', '#2f6238', '#efe5c4', '#dcb236'],
  ['TUNA', '#1f4a72', '#e2e8ea', '#86a8c2'],
  ['BEANS', '#6f381d', '#ecdfc8', '#9a5230'],
  ['PEACH', '#cf8228', '#f3e7d1', '#eb9c3a'],
];
function canLabel(kind) {
  const [name, bg, band, pic] = kind;
  return labelTexture('can' + name, 512, 160, (x, w, h) => {
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.fillStyle = band;
    x.fillRect(0, h * 0.2, w, h * 0.6);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    // the same face twice, on opposite sides of the can
    [0.25, 0.75].forEach((u) => {
      x.fillStyle = pic;
      x.beginPath();
      x.arc(w * u, h * 0.4, h * 0.15, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = bg;
      x.font = `bold ${name.length > 6 ? 21 : 26}px Arial, sans-serif`;
      x.fillText(name, w * u, h * 0.68);
    });
  });
}
// name, box colour, accent colour
const SNACK_KINDS = [
  ['CRACKERS', '#b8402c', '#f1dfbc'],
  ['COOKIES', '#2c4a80', '#eed5a2'],
  ['GRANOLA', '#547636', '#f0e6cd'],
  ['CHIPS', '#d59a22', '#fbf1d6'],
  ['CEREAL', '#70458f', '#f3dfa2'],
];
function snackFace(kind) {
  const [name, bg, accent] = kind;
  return labelTexture('snack' + name, 256, 352, (x, w, h) => {
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.fillStyle = accent;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = 'bold 40px Arial, sans-serif';
    x.fillText(name, w / 2, h * 0.17, w * 0.86);
    x.fillRect(w * 0.2, h * 0.27, w * 0.6, 4);
    // a plate of the snack
    x.beginPath();
    x.arc(w / 2, h * 0.63, w * 0.34, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = bg;
    x.globalAlpha = 0.55;
    [[-0.13, -0.08], [0.1, -0.12], [-0.02, 0.06], [0.15, 0.08], [-0.16, 0.12]].forEach(([dx, dy]) => {
      x.beginPath();
      x.arc(w * (0.5 + dx), h * 0.63 + w * dy, w * 0.085, 0, Math.PI * 2);
      x.fill();
    });
    x.globalAlpha = 1;
  });
}

/* A front-loading washing machine (600 x 850 x 600) for the open space
   at the bottom of an Open Base shelf. maxH = free height under the
   lowest level. Left out if it would have to shrink noticeably.       */
const WASHER = { w: 0.6, h: 0.85, d: 0.6 };
function washerScale(w, maxH) {
  return Math.min(1, (maxH - 0.01) / WASHER.h, (w - 0.09) / WASHER.w);
}
function addWasher(group, w, d, maxH) {
  const s = washerScale(w, maxH);
  if (s < 0.85) return false;
  const { mat, put } = displayKit(group, 1);
  const W = WASHER.w,
    H = WASHER.h,
    D = WASHER.d;
  const g = new THREE.Group();
  g.scale.setScalar(s);
  // a shelf shallower than the machine: backs in line, machine out front
  g.position.z = d >= D * s ? 0 : -d / 2 + (D * s) / 2;
  group.add(g);
  const white = mat(0xd6d6d3, 0.35);
  const grey = mat(0xa9acae, 0.35);
  const dark = mat(0x16191c, 0.25);
  const f = D / 2; // front face
  const lie = (m) => {
    m.rotation.x = Math.PI / 2;
    return m;
  };
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) =>
      put(g, new THREE.CylinderGeometry(0.02, 0.02, 0.016, 12), dark, sx * (W / 2 - 0.05), 0.008, sz * (D / 2 - 0.05))
    )
  );
  put(g, new THREE.BoxGeometry(W, H - 0.016, D), white, 0, 0.016 + (H - 0.016) / 2, 0);
  // control panel across the top of the front
  const py = H - 0.07;
  put(g, new THREE.BoxGeometry(W - 0.012, 0.105, 0.008), grey, 0, py, f + 0.003);
  put(g, new THREE.BoxGeometry(0.17, 0.075, 0.006), white, -W / 2 + 0.11, py, f + 0.008); // detergent drawer
  put(g, new THREE.BoxGeometry(0.11, 0.012, 0.004), grey, -W / 2 + 0.11, py - 0.022, f + 0.012);
  lie(put(g, new THREE.CylinderGeometry(0.034, 0.034, 0.022, 24), white, 0.03, py, f + 0.016)); // dial
  lie(put(g, new THREE.CylinderGeometry(0.02, 0.02, 0.026, 20), grey, 0.03, py, f + 0.018));
  put(g, new THREE.BoxGeometry(0.13, 0.042, 0.004), dark, 0.19, py + 0.008, f + 0.008); // display
  [0.145, 0.175, 0.205, 0.235].forEach((bx) =>
    lie(put(g, new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10), white, bx, py - 0.032, f + 0.008))
  );
  // door: white surround, grey ring, dark domed glass
  const dy = 0.4;
  put(g, new THREE.TorusGeometry(0.212, 0.016, 10, 44), white, 0, dy, f + 0.004);
  put(g, new THREE.TorusGeometry(0.18, 0.03, 12, 44), grey, 0, dy, f + 0.016);
  const glass = put(g, new THREE.SphereGeometry(0.158, 28, 16), dark, 0, dy, f + 0.006);
  glass.scale.z = 0.28;
  put(g, new THREE.BoxGeometry(0.022, 0.1, 0.02), grey, -0.2, dy, f + 0.034); // handle
  // plinth line and filter cover
  put(g, new THREE.BoxGeometry(W - 0.012, 0.004, 0.004), grey, 0, 0.11, f + 0.002);
  put(g, new THREE.BoxGeometry(0.08, 0.06, 0.004), grey, W / 2 - 0.09, 0.06, f + 0.002);
  return true;
}
/* free height under the lowest level of an open base shelf, in metres */
function hhOpenBaseRoom(p, levels) {
  const L = levels[1];
  if (!L) return 0;
  return L.h * MM_TO_M - HH.beamH - (L.style === 'basket' ? 0 : 0.009);
}
const DISPLAY_NEED = Object.fromEntries(DISPLAY_ITEMS.map((d) => [d[0], d[2]]));
/* how many item slots a level of this width has (w in metres) */
function displaySlotCount(w, basket) {
  const usableW = w - (basket ? 0.024 : 0) - 0.07;
  return usableW >= 1.0 ? 3 : usableW >= 0.6 ? 2 : 1;
}

/* Fill one shelf level. yTop = top surface of the board, clear = free
   height above it, inset = extra margin when the board sits in a basket.
   picks = the user's choice per slot: an item type, 'none', or
   'auto' / missing to let the simulator choose.                       */
function addDisplayItems(group, w, d, yTop, clear, seed, inset = 0, picks = null) {
  const usableW = w - 2 * inset - 0.07;
  const usableD = d - 2 * inset - 0.07;
  if (clear < 0.08 || usableW < 0.15 || usableD < 0.15) return;
  const slots = displaySlotCount(w, inset > 0);
  const slotW = usableW / slots;

  // a TV takes the whole level, whichever spot it was picked for
  if (picks && picks.slice(0, slots).includes('tv')) {
    const g = new THREE.Group();
    g.position.set(0, yTop, 0);
    const { mat, put } = displayKit(g, seed);
    const tw = Math.min(usableW * 0.95, 1.25, ((clear - 0.07) * 16) / 9);
    if (tw < 0.3) return;
    const sh = (tw * 9) / 16;
    const body = mat(0x0b0b0d, 0.4);
    put(g, new THREE.BoxGeometry(tw * 0.34, 0.01, Math.min(0.2, usableD * 0.9)), body, 0, 0.005, 0);
    put(g, new THREE.BoxGeometry(0.05, 0.05, 0.022), body, 0, 0.03, -0.01);
    put(g, new THREE.BoxGeometry(tw, sh, 0.028), body, 0, 0.05 + sh / 2, 0);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(tw - 0.016, sh - 0.016),
      new THREE.MeshBasicMaterial({ map: screenTexture() })
    );
    screen.position.set(0, 0.05 + sh / 2, 0.0145);
    g.add(screen);
    group.add(g);
    return;
  }

  for (let k = 0; k < slots; k++) {
    // every slot has its own random sequence, so changing one slot
    // never reshuffles its neighbours
    const g = new THREE.Group();
    g.position.set(-usableW / 2 + slotW * (k + 0.5), yTop, 0);
    const { rng, R, pick, mat, put } = displayKit(g, seed + k * 131);
    const choice = (picks && picks[k]) || 'auto';
    if (choice === 'none') continue;

    let type = choice;
    if (choice === 'auto') {
      if (rng() < 0.12) continue; // leave a gap now and then
      const options = [['box', 3], ['basket', 2], ['towels', 1.5], ['booksFlat', 1]];
      if (clear >= 0.22) options.push(['jars', 2]);
      if (clear >= 0.24) options.push(['ball', 0.7]);
      if (clear >= 0.3) options.push(['booksUp', 2.5]);
      if (clear >= 0.3) options.push(['vase', 1]);
      if (clear >= 0.14) options.push(['cans', 1.2]);
      if (clear >= 0.2) options.push(['fruit', 1]);
      if (clear >= 0.28) options.push(['snacks', 1.2]);
      if (clear >= 0.29) options.push(['frame', 0.8]);
      if (clear >= 0.42) options.push(['plant', 1.5]);
      if (clear >= 0.64 && slotW >= 0.44 && usableD >= 0.26) options.push(['suitcase', 2]);
      let total = 0;
      options.forEach((o) => (total += o[1]));
      let t = rng() * total;
      type = options[0][0];
      for (const o of options) {
        t -= o[1];
        if (t <= 0) {
          type = o[0];
          break;
        }
      }
    }
    // real model first, at its true size where it fits
    {
      const room = clear - 0.02;
      const yaw = R(-0.15, 0.15);
      let placed = false;
      if (type === 'plant') {
        // the tall leafy plant when there is height for it, else the small pot
        if (room >= 0.5 && rng() < 0.6)
          placed = placePropModel(g, 'plantBig', slotW * 1.25, usableD * 1.5, Math.min(room, 0.62), R(0, 6), 0.4, 0.75);
        if (!placed) placed = placePropModel(g, 'plant', slotW * 0.8, usableD * 0.8, room, R(0, 6));
      } else if (type === 'box') {
        placed = placePropModel(g, 'box', slotW * 0.86 * R(0.8, 1), usableD * 0.92, room, R(-0.06, 0.06), 0.45);
      } else if (type === 'basket') {
        placed = placePropModel(g, 'basket', slotW * 0.9, usableD * 0.9, room, R(-0.2, 0.2));
      } else if (type === 'ball') {
        placed = placePropModel(g, 'ball', slotW * 0.9, usableD * 0.9, room, R(0, 6), 0.8);
        if (placed) {
          // spin the ball about its own centre so each one shows a different side
          const obj = g.children[0];
          const r = (PROP_MODELS.ball.size.y / 2) * obj.scale.y;
          const pivot = new THREE.Group();
          pivot.position.y = r;
          obj.position.y = -r;
          obj.rotation.y = 0;
          g.remove(obj);
          pivot.add(obj);
          pivot.rotation.set(R(0, 6), R(0, 6), R(0, 6));
          g.add(pivot);
        }
      } else if (type === 'suitcase') {
        placed = placePropModel(g, 'suitcase', slotW * 0.95, usableD * 0.95, room, R(-0.05, 0.05), 0.55);
      } else if (type === 'vase') {
        placed = placePropModel(g, rng() < 0.5 ? 'vase1' : 'vase2', slotW * 0.6, usableD * 0.7, Math.min(room, 0.4), yaw, 0.6);
      } else if (type === 'frame' && PROP_MODELS.frame1 && PROP_MODELS.frame2) {
        // one framed photo, or two side by side on a wide spot
        const names = rng() < 0.5 ? ['frame1', 'frame2'] : ['frame2', 'frame1'];
        const n = slotW >= 0.42 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const m = PROP_MODELS[names[i]];
          const s = Math.min(1, room / m.size.y, (slotW * 0.9) / n / m.size.z) * (i ? 0.8 : 1);
          if (s < 0.5) continue;
          const obj = m.scene.clone(true);
          obj.scale.setScalar(s);
          obj.rotation.y = FRAME_TURN + R(-0.25, 0.25);
          obj.position.set(n === 1 ? 0 : (i - 0.5) * slotW * 0.46, 0, i ? 0.03 : -0.02);
          g.add(obj);
          placed = true;
        }
      } else if (type === 'fruit' && PROP_MODELS.bowl && PROP_MODELS.apple) {
        const bowl = PROP_MODELS.bowl;
        const s = Math.min(1, (slotW * 0.92) / bowl.size.x, (usableD * 0.95) / bowl.size.z, room / 0.2);
        if (s >= 0.55) {
          const set = new THREE.Group();
          set.scale.setScalar(s);
          set.add(bowl.scene.clone(true));
          const fruit = ['apple', 'pomegranate', 'lime', 'apple', 'avocado', 'lime'].filter((f) => PROP_MODELS[f]);
          const a0 = R(0, 6);
          fruit.forEach((name, i) => {
            const obj = PROP_MODELS[name].scene.clone(true);
            const a = a0 + (i / (fruit.length - 1)) * Math.PI * 2;
            const rr = i === 0 ? 0 : 0.078;
            obj.position.set(Math.cos(a) * rr, i === 0 ? 0.05 : 0.036, Math.sin(a) * rr);
            obj.rotation.set(R(-0.5, 0.5), R(0, 6), R(-0.5, 0.5));
            if (name === 'avocado') obj.rotation.z = 1.1;
            set.add(obj);
          });
          g.add(set);
          placed = true;
        }
      } else if (type === 'booksUp' && PROP_MODELS.books) {
        // one or two runs of books side by side
        const bw = PROP_MODELS.books.size.x;
        const s = Math.min(1, (room - 0.01) / PROP_MODELS.books.size.y, (usableD * 0.95) / PROP_MODELS.books.size.z);
        if (s >= 0.6) {
          const n = Math.max(1, Math.min(2, Math.floor((slotW * 0.9) / (bw * s))));
          for (let i = 0; i < n; i++) {
            const run = PROP_MODELS.books.scene.clone(true);
            run.scale.setScalar(s);
            run.position.x = (i - (n - 1) / 2) * bw * s;
            if (i % 2) run.rotation.y = Math.PI;
            g.add(run);
          }
          placed = true;
        }
      }
      if (placed) {
        group.add(g);
        continue;
      }
    }
    // c = the height the item is built for; shrink the whole item if the
    // level is lower than that
    const need = DISPLAY_NEED[type] || 0.08;
    const c = Math.max(clear, need);
    const scale = clear < need ? clear / need : 1;
    if (scale < 0.55) continue; // far too tall for this level
    g.scale.setScalar(scale);
    const sw = slotW / scale,
      sd = usableD / scale; // room available in the item's own units

    if (type === 'box') {
      const bw = Math.min(sw * 0.82, 0.38) * R(0.75, 1);
      const bd = Math.min(sd * 0.85, 0.32) * R(0.8, 1);
      const bh = Math.min(c * 0.75, 0.28) * R(0.6, 1);
      g.rotation.y = R(-0.12, 0.12);
      put(g, new THREE.BoxGeometry(bw, bh, bd), mat(pick([0x8a6a45, 0x9a7850, 0x7d6040])), 0, bh / 2, 0);
      put(g, new THREE.BoxGeometry(bw * 0.14, 0.002, bd * 1.001), mat(0xb7a07a), 0, bh + 0.001, 0);
      if (c > bh + 0.16 && rng() < 0.4) {
        const tw = bw * R(0.6, 0.85),
          th = Math.min(0.12, c - bh - 0.04) * R(0.7, 1),
          td = bd * R(0.6, 0.85);
        const top = put(g, new THREE.BoxGeometry(tw, th, td), mat(pick([0x9a7850, 0xcfc8ba, 0x6f7c86])), R(-0.02, 0.02), bh + th / 2, 0);
        top.rotation.y = R(-0.2, 0.2);
      }
    } else if (type === 'basket') {
      const r = Math.min(Math.min(sw, sd) * 0.5 * R(0.72, 0.86), 0.17);
      const h = Math.min(c * 0.6, 0.2) * R(0.8, 1);
      put(g, new THREE.CylinderGeometry(r, r * 0.82, h, 20), mat(pick([0x8f6f45, 0xa58555, 0x6d5335]), 0.95), 0, h / 2, 0);
      put(g, new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.004, 20), mat(0x3f3122), 0, h + 0.001, 0);
      const fill = mat(pick([0xb99a62, 0xa8553a, 0x8a9a4a]));
      const n = 3 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2,
          rr = r * R(0.1, 0.55);
        put(g, new THREE.SphereGeometry(r * R(0.22, 0.3), 10, 8), fill, Math.cos(a) * rr, h + r * 0.06, Math.sin(a) * rr);
      }
    } else if (type === 'booksUp') {
      const span = Math.min(sw * 0.8, 0.3);
      const tones = [0x394a63, 0x6b3a3a, 0x40584a, 0x8a7a55, 0x2c2c30, 0xb7b0a2, 0x7a5a6a];
      let x = -span / 2;
      while (x < span / 2 - 0.02) {
        const t = R(0.018, 0.04),
          bh = Math.min(R(0.19, 0.26), c - 0.03),
          bd = Math.min(R(0.14, 0.19), sd * 0.9);
        put(g, new THREE.BoxGeometry(t, bh, bd), mat(pick(tones), 0.7), x + t / 2, bh / 2, 0);
        x += t + 0.002;
      }
    } else if (type === 'booksFlat') {
      const tones = [0x394a63, 0x6b3a3a, 0x40584a, 0x8a7a55, 0xb7b0a2];
      const n = Math.max(1, Math.min(4, Math.floor((c - 0.02) / 0.032)));
      g.rotation.y = R(-0.25, 0.25);
      for (let i = 0; i < n; i++) {
        const book = put(g, new THREE.BoxGeometry(Math.min(R(0.2, 0.26), sw * 0.9), 0.03, Math.min(R(0.15, 0.19), sd * 0.9)), mat(pick(tones), 0.7), 0, 0.015 + i * 0.031, 0);
        book.rotation.y = R(-0.15, 0.15);
      }
    } else if (type === 'jars') {
      const n = Math.max(1, Math.min(3, Math.floor(sw / 0.115)));
      const lid = mat(pick([0x2b2b2b, 0x8a6a45, 0xa9a9a9]), 0.5);
      for (let i = 0; i < n; i++) {
        const r = R(0.038, 0.05),
          h = Math.min(R(0.12, 0.18), c - 0.05);
        const x = (i - (n - 1) / 2) * 0.112;
        const z = R(-0.03, 0.03);
        put(g, new THREE.CylinderGeometry(r, r, h, 18), mat(pick([0xb9c7c2, 0xc2ad8c, 0x9fb3a5, 0xd0c9bb]), 0.25), x, h / 2, z);
        put(g, new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.02, 18), lid, x, h + 0.01, z);
      }
    } else if (type === 'plant') {
      put(g, new THREE.CylinderGeometry(0.07, 0.055, 0.11, 18), mat(pick([0xa35d3d, 0xd3cec4, 0x3d3d3d])), 0, 0.055, 0);
      const greens = [0x3f6b3a, 0x4f7d45, 0x2f5a33];
      const top = Math.min(0.3, c - 0.08);
      for (let i = 0; i < 7; i++) {
        const a = rng() * Math.PI * 2,
          rr = R(0, 0.07);
        put(g, new THREE.IcosahedronGeometry(R(0.05, 0.08), 1), mat(pick(greens), 0.9), Math.cos(a) * rr, 0.13 + rng() * (top - 0.08), Math.sin(a) * rr);
      }
    } else if (type === 'vase') {
      const h = Math.min(0.32, c - 0.04);
      const glaze = mat(pick([0xb9b9b4, 0x8fa3a8, 0xa9836a]), 0.4);
      put(g, new THREE.CylinderGeometry(0.035, 0.07, h * 0.6, 20), glaze, 0, h * 0.3, 0);
      put(g, new THREE.CylinderGeometry(0.03, 0.035, h * 0.4, 20), glaze, 0, h * 0.8, 0);
    } else if (type === 'towels') {
      const tones = [0xdedad2, 0xb9c4b4, 0xd9b9b3, 0x8f9aa8];
      const n = Math.max(1, Math.min(4, Math.floor((c - 0.02) / 0.05)));
      g.rotation.y = R(-0.08, 0.08);
      for (let i = 0; i < n; i++)
        put(g, new THREE.BoxGeometry(Math.min(sw * 0.8, 0.3), 0.045, Math.min(sd * 0.8, 0.2)), mat(pick(tones), 1), R(-0.008, 0.008), 0.0225 + i * 0.047, R(-0.008, 0.008));
    } else if (type === 'ball') {
      // size-5 football: white ball with the twelve black pentagons,
      // one at each corner of an icosahedron
      const r = 0.11;
      const ball = new THREE.Group();
      ball.position.set(R(-0.02, 0.02), r, R(-0.02, 0.02));
      ball.rotation.set(R(0, 3), R(0, 3), R(0, 3));
      g.add(ball);
      put(ball, new THREE.SphereGeometry(r, 28, 20), mat(0xb9b9b6, 0.45), 0, 0, 0);
      const patch = mat(0x141414, 0.5);
      const corners = new THREE.IcosahedronGeometry(1, 0).attributes.position;
      const seen = [];
      for (let i = 0; i < corners.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(corners, i).normalize();
        if (seen.some((q) => q.distanceTo(v) < 0.01)) continue;
        seen.push(v);
        // a five-sided cap of a slightly larger sphere: large enough that
        // its straight edges stay outside the ball and read as a pentagon
        const pent = put(ball, new THREE.SphereGeometry(r * 1.035, 5, 3, 0, Math.PI * 2, 0, 0.37), patch, 0, 0, 0);
        pent.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
        pent.castShadow = false;
      }
    } else if (type === 'cans') {
      // tins in rows, one kind per column, some columns stacked two high
      const r = 0.037,
        h = 0.11,
        step = 0.08;
      const cols = Math.max(1, Math.min(4, Math.floor((sw * 0.94) / step)));
      const rows = sd >= 0.2 ? 2 : 1;
      const steel = mat(0xa7abae, 0.3);
      for (let i = 0; i < cols; i++) {
        const side = new THREE.MeshStandardMaterial({ map: canLabel(pick(CAN_KINDS)), color: 0xd0d0d0, roughness: 0.5, metalness: 0 });
        const high = c >= 2 * h + 0.03 && rng() < 0.55 ? 2 : 1;
        for (let j = 0; j < rows; j++)
          for (let k = 0; k < (j === 0 && rows > 1 ? 1 : high); k++) {
            const can = put(g, new THREE.CylinderGeometry(r, r, h, 24), [side, steel, steel], (i - (cols - 1) / 2) * step, h / 2 + k * (h + 0.002), (rows > 1 ? (j ? -0.045 : 0.04) : 0) + R(-0.004, 0.004));
            can.rotation.y = Math.PI / 2 + R(-0.35, 0.35);
            [0, h].forEach((y) => put(g, new THREE.CylinderGeometry(r + 0.0015, r + 0.0015, 0.004, 24), steel, can.position.x, can.position.y - h / 2 + y, can.position.z));
          }
      }
    } else if (type === 'snacks') {
      // upright cartons facing the front, a second one behind each
      const bw = 0.17,
        bd = 0.055,
        bh = Math.min(0.25, c - 0.02);
      const n = Math.max(1, Math.min(3, Math.floor((sw * 0.96) / (bw + 0.012))));
      for (let i = 0; i < n; i++) {
        const kind = pick(SNACK_KINDS);
        const face = new THREE.MeshStandardMaterial({ map: snackFace(kind), color: 0xcfcfcf, roughness: 0.7, metalness: 0 });
        const plain = mat(new THREE.Color(kind[1]).multiplyScalar(0.8).getHex(), 0.7);
        const deep = sd >= 0.17 ? 2 : 1;
        for (let j = 0; j < deep; j++) {
          const box = put(g, new THREE.BoxGeometry(bw, bh, bd), [plain, plain, plain, plain, face, face], (i - (n - 1) / 2) * (bw + 0.012), bh / 2, (deep > 1 ? 0.035 - j * (bd + 0.006) : 0));
          box.rotation.y = j ? 0 : R(-0.07, 0.07);
        }
      }
    } else if (type === 'frame') {
      const fh = Math.min(0.25, c - 0.03),
        fw = fh * 0.78;
      const lean = new THREE.Group();
      lean.rotation.set(-0.16, R(-0.2, 0.2), 0);
      g.add(lean);
      put(lean, new THREE.BoxGeometry(fw, fh, 0.014), mat(pick([0x1c1c1c, 0xc9c6bf, 0x7a5a3c]), 0.5), 0, fh / 2, 0);
      put(lean, new THREE.BoxGeometry(fw * 0.8, fh * 0.84, 0.002), mat(pick([0x9fb0b8, 0xb9ad98, 0x8d9a8a]), 0.9), 0, fh / 2, 0.008);
    } else if (type === 'fruit') {
      const r = Math.min(0.15, Math.min(sw, sd) * 0.46);
      put(g, new THREE.CylinderGeometry(r, r * 0.55, 0.08, 24), mat(0x7d5a3a, 0.7), 0, 0.04, 0);
      const tones = [0xa8332b, 0x7c9a3a, 0xc9892b, 0x9c2f3a, 0x6d8a35];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + R(0, 1);
        put(g, new THREE.SphereGeometry(r * 0.3, 14, 10), mat(tones[i], 0.6), Math.cos(a) * r * 0.45, 0.09, Math.sin(a) * r * 0.45);
      }
    } else if (type === 'laptop') {
      // open notebook: base, keyboard, and the lid leaning back
      const lw = 0.32,
        ld = 0.22;
      const fit = Math.min(1, (sw * 0.92) / lw, (sd * 0.95) / (ld + 0.03));
      g.scale.setScalar(scale * fit);
      g.rotation.y = R(-0.12, 0.12);
      const shell = mat(0x8d9094, 0.4);
      put(g, new THREE.BoxGeometry(lw, 0.014, ld), shell, 0, 0.007, 0);
      put(g, new THREE.BoxGeometry(lw * 0.88, 0.001, ld * 0.46), mat(0x1b1c1f, 0.6), 0, 0.0146, -ld * 0.16);
      put(g, new THREE.BoxGeometry(lw * 0.3, 0.001, ld * 0.26), mat(0x7b7e82, 0.3), 0, 0.0146, ld * 0.3);
      const lid = new THREE.Group();
      lid.position.set(0, 0.014, -ld / 2);
      lid.rotation.x = -0.3;
      g.add(lid);
      put(lid, new THREE.BoxGeometry(lw, ld, 0.006), shell, 0, ld / 2, -0.003);
      const scr = new THREE.Mesh(
        new THREE.PlaneGeometry(lw - 0.02, ld - 0.022),
        new THREE.MeshBasicMaterial({ map: screenTexture() })
      );
      scr.position.set(0, ld / 2, 0.0005);
      lid.add(scr);
    } else if (type === 'suitcase') {
      g.rotation.y = R(-0.06, 0.06);
      const shell = mat(pick([0x1f3d36, 0x2b2f3a, 0x55585c]), 0.5);
      put(g, new THREE.BoxGeometry(Math.min(0.4, sw * 0.95), 0.56, Math.min(0.24, sd * 0.95)), shell, 0, 0.31, 0);
      put(g, new THREE.BoxGeometry(0.14, 0.025, 0.02), mat(0x1a1a1a), 0, 0.605, 0);
      [-0.15, 0.15].forEach((x) =>
        [-0.08, 0.08].forEach((z) =>
          put(g, new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10), mat(0x111111), x, 0.015, z)
        )
      );
    } else {
      continue;
    }
    group.add(g);
  }
}

/* Clothes on the hanger bar: a wooden hanger and a garment for each,
   hanging across the depth of the rack. maxLen keeps them clear of
   whatever is on the level below.                                    */
function addHangingClothes(group, w, d, rodY, maxLen, seed) {
  const { rng, R, pick, mat, put, sub } = displayKit(group, seed);
  if (maxLen < 0.3) return;
  const tones = [0x9c2a2a, 0x6d6a64, 0x232a3a, 0x1c1c1c, 0xcfcac0, 0xb98a8f, 0x4b5a4a];
  const wood = mat(0x8a6a45, 0.6);
  const steel = mat(0xcfd3d7, 0.3);
  const n = 4 + Math.floor(rng() * 4);
  let x = R(-w / 2 + 0.12, -w / 2 + 0.3);
  for (let i = 0; i < n && x < w / 2 - 0.12; i++) {
    const gw = Math.min(d - 0.12, R(0.34, 0.42));
    const len = maxLen * R(0.55, 1);
    const thick = R(0.025, 0.045);
    const g = sub(x, rodY, 0, R(-0.1, 0.1));
    put(g, new THREE.CylinderGeometry(0.003, 0.003, 0.05, 6), steel, 0, -0.012, 0);
    put(g, new THREE.BoxGeometry(0.012, 0.016, gw), wood, 0, -0.045, 0);
    const cloth = mat(pick(tones), 1);
    put(g, new THREE.BoxGeometry(thick, 0.06, gw * 0.55), cloth, 0, -0.07, 0); // collar
    put(g, new THREE.BoxGeometry(thick, len, gw), cloth, 0, -0.09 - len / 2, 0);
    x += R(0.07, 0.11);
  }
}

/* HOMEDANT HOUSE hanger bar: a bright steel tube running the width of
   the shelf, held by a round cup on the inside of each SIDE beam of the
   top level, low on the beam so the cup hangs just below its edge.     */
function addHHHangerBar(group, w, d, frameMat, tiers, li = tiers - 1) {
  const SB = specOf(frameMat);
  const { postT: T, sheet: t, beamH: BH } = SB.kind === 'lr' ? HH : SB;
  const hh = frameMat.userData.hh;
  const lv = hhResolveLevels(hh.product, tiers);
  const top = lv[li];
  const beamTop = top.h * MM_TO_M - (top.style === 'basket' ? 0 : 0.009);
  const y = beamTop - BH + 0.005;
  const len = w - 2 * (T + t);
  const steel = new THREE.MeshStandardMaterial({
    color: 0xe8ebee,
    metalness: 0.15,
    roughness: 0.25,
    emissive: 0x2e2e2e, // keeps the bright tube from going grey in shade
  });
  const rodGeo = new THREE.CylinderGeometry(0.0125, 0.0125, len - 0.02, 20);
  rodGeo.rotateZ(Math.PI / 2);
  hhAdd(group, rodGeo, steel, 0, y, 0);
  if (hh.product.showItems) {
    const below = li > 0 ? lv[li - 1].h * MM_TO_M : 0;
    addHangingClothes(
      group,
      w,
      d,
      y,
      Math.min(1.05, (y - below) * (li > 0 ? 0.62 : 0.8)),
      hashSeed(hh.product.instanceId || 'item') + 31 + (tiers - 1 - li) * 57
    );
  }
  const cupGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.014, 20);
  cupGeo.rotateZ(Math.PI / 2);
  [-1, 1].forEach((s) => {
    hhAdd(group, cupGeo, frameMat, s * (len / 2 - 0.007), y, 0);
  });
}

/* HOMEDANT HOUSE caster set: a zinc bracket pushed up inside the bottom
   of each post, and a 3-inch swivel caster bolted into it. The caster
   is 104 mm from the floor to the underside of the post. Built around
   the swivel axis, with the wheel trailing behind it.                  */
const HH_CASTER_H = 0.104;
// models up to 600 wide and 400 deep take 2-inch casters: 2.7" (69 mm)
// instead of 4.1" (104 mm) from the floor to the post
// (homedant.com: 62.2" vs 59.5" for 600x400)
const HH_CASTER_H2 = 0.069;
const hhSmallCaster = (p) => p.width <= 600 && p.depth <= 400;
function hhCasterH(p) {
  return p.caster2in ? HH_CASTER_H2 : HH_CASTER_H;
}
/* What you pick is the size name (900 x 400 x 1800). The real product
   is a little bigger outside: homedant.com lists 36.2" x 16.5" x 71.3"
   for that one, i.e. +20 mm on width and depth (+22 mm at 1200 wide) and
   the post caps standing 11 mm above the frame. The 3D uses the real
   outside, the name stays as picked.                                    */
const HH_CAP_RISE = 11;
function hhOuterMM(v) {
  return v + (v >= 1200 ? 22 : 20);
}
const inch1 = (mm) => (mm / 25.4).toFixed(1);
function hhOuterLabel(p) {
  const o = hhOuterSize(p);
  return {
    mm: `${o.width} x ${o.depth} x ${o.height} mm`,
    inch: `${inch1(o.width)} x ${inch1(o.depth)} x ${inch1(o.height)} in`,
  };
}
function hhOuterSize(p) {
  const rolling = ['hh_rolling', 'hh_trolley', 'hh_perf_trolley', 'sp_rolling', 'lr_rolling'].includes(p.productId);
  const casterMM = rolling ? (hhSmallCaster(p) ? 69 : 104) : 0;
  const S = specOfProduct(p);
  if (S.kind === 'sp')
    // homedant.com SS shelves: 12 mm wider and deeper, 11 mm taller
    return { width: p.width + 12, depth: p.depth + 12, height: p.height + 11 + casterMM };
  if (S.kind === 'lr')
    // no published outside size yet: drawn to the size name
    return { width: p.width, depth: p.depth, height: p.height + casterMM };
  return {
    width: hhOuterMM(p.width),
    depth: hhOuterMM(p.depth),
    height: p.height + HH_CAP_RISE + casterMM,
  };
}
function addHHCaster(group, x, z, angle, brake, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = angle;
  g.scale.setScalar(scale);
  const black = new THREE.MeshStandardMaterial({
    color: 0x161616,
    metalness: 0.2,
    roughness: 0.5,
  });
  const tyre = new THREE.MeshStandardMaterial({
    color: 0x101010,
    metalness: 0,
    roughness: 0.35,
  });
  const hub = new THREE.MeshStandardMaterial({
    color: 0xcfc7b2,
    metalness: 0,
    roughness: 0.5,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0xe2e5e8,
    metalness: 0.15,
    roughness: 0.3,
  });
  const R = 0.038; // 3-inch wheel
  const trail = -0.026; // wheel centre sits behind the swivel axis
  const axis = (geo) => {
    geo.rotateX(Math.PI / 2); // lay the cylinder on its side (axle along z)
    return geo;
  };
  // wheel: black tyre, pale hub showing on both faces, axle nut
  hhAdd(g, axis(new THREE.CylinderGeometry(R, R, 0.022, 28)), tyre, trail, R, 0);
  hhAdd(g, axis(new THREE.CylinderGeometry(R * 0.72, R * 0.72, 0.024, 24)), hub, trail, R, 0);
  hhAdd(g, axis(new THREE.CylinderGeometry(0.012, 0.012, 0.026, 16)), black, trail, R, 0);
  hhAdd(g, axis(new THREE.CylinderGeometry(0.0065, 0.0065, 0.04, 6)), steel, trail, R, 0);
  // fork: one swept plate each side of the wheel, joined across the top
  const side = new THREE.Shape();
  side.moveTo(-0.06, 0.09);
  side.lineTo(0.03, 0.09);
  side.lineTo(-0.006, 0.026);
  side.lineTo(-0.042, 0.026);
  side.lineTo(-0.06, 0.07);
  side.closePath();
  const sideGeo = new THREE.ExtrudeGeometry(side, {
    depth: 0.002,
    bevelEnabled: false,
  });
  hhAdd(g, sideGeo, black, 0, 0, 0.0145);
  hhAdd(g, sideGeo, black, 0, 0, -0.0165);
  hhAdd(g, new THREE.BoxGeometry(0.09, 0.004, 0.033), black, -0.015, 0.09, 0);
  // swivel plate, lock nut and the threaded stem that goes up into the bracket
  hhAdd(g, new THREE.CylinderGeometry(0.027, 0.027, 0.008, 24), black, 0, 0.096, 0);
  hhAdd(g, new THREE.CylinderGeometry(0.009, 0.009, 0.005, 6), steel, 0, 0.1015, 0);
  hhAdd(g, new THREE.CylinderGeometry(0.005, 0.005, 0.03, 10), steel, 0, 0.115, 0);
  if (brake) {
    // foot brake lever sticking out behind the wheel
    hhAdd(g, new THREE.BoxGeometry(0.036, 0.006, 0.02), black, -0.076, 0.085, 0);
    hhAdd(g, new THREE.BoxGeometry(0.014, 0.012, 0.02), black, -0.097, 0.082, 0);
  }
  group.add(g);
}

function addHHCasters(group, inner, w, d, casterH = HH_CASTER_H) {
  const scale = casterH / HH_CASTER_H;
  const { postT: T } = HH;
  const zinc = new THREE.MeshStandardMaterial({
    color: 0xc9cdd2,
    metalness: 0.2,
    roughness: 0.4,
  });
  const plateX = new THREE.BoxGeometry(0.03, 0.07, 0.0015);
  const plateZ = new THREE.BoxGeometry(0.0015, 0.07, 0.03);
  const base = new THREE.BoxGeometry(0.036, 0.003, 0.036);
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz]) => {
    const ex = sx * (w / 2),
      ez = sz * (d / 2);
    // bracket: two plates against the inside of the post + a base plate
    hhAdd(inner, plateX, zinc, ex - sx * (T + 0.019), 0.035, ez - sz * (T + 0.001));
    hhAdd(inner, plateZ, zinc, ex - sx * (T + 0.001), 0.035, ez - sz * (T + 0.019));
    hhAdd(inner, base, zinc, ex - sx * 0.022, 0.0015, ez - sz * 0.022);
    // caster under the bracket; the left pair (as you face it) carries
    // the brakes, the right pair turns freely
    // wheels trail in under the frame, so the casters stay inside the
    // shelf's footprint (homedant.com gives the same W x D for both)
    const angle = sx > 0 ? -sz * 0.4 : Math.PI + sz * 0.4;
    addHHCaster(group, ex - sx * 0.022, ez - sz * 0.022, angle, sx < 0, scale);
  });
}

function hhHangerCount(p, tiers) {
  if (tiers < 3) return 1;
  return p.hangers === 1 ? 1 : 2;
}
function buildGarmentRack(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, {
    perforated,
    house: isLevelProduct(tpl),
  });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  const gTiers = p.tier || tpl.defaultTier;
  // one bar under the top level; with three levels a second bar can hang
  // under the middle one
  const bars = [gTiers - 1];
  if (gTiers >= 3 && hhHangerCount(p, gTiers) === 2) bars.push(gTiers - 2);
  if (mats.frame.userData.hh) mats.frame.userData.hh.barLevels = bars;
  addTierBoards(group, w, d, h, gTiers, mats.board, {
    frameMat: mats.frame,
  });
  if (mats.frame.userData.hh) {
    bars.forEach((li) => addHHHangerBar(group, w, d, mats.frame, gTiers, li));
  } else {
    // hanger bar — sits just below the top board so clothes hang from the
    // top of the rack like a real garment rack (was floating mid-height).
    const barGeo = new THREE.CylinderGeometry(0.012, 0.012, w - 0.06, 12);
    const bar = new THREE.Mesh(barGeo, mats.frame);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, h - 0.1, 0); // ~100mm under the top board
    bar.castShadow = true;
    group.add(bar);
    // two short drop brackets connecting the bar up to the top board
    const dropGeo = new THREE.BoxGeometry(0.012, 0.085, 0.012);
    [-(w / 2) + 0.1, w / 2 - 0.1].forEach((bx) => {
      const drop = new THREE.Mesh(dropGeo, mats.frame);
      drop.position.set(bx, h - 0.055, 0);
      group.add(drop);
    });
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildRolling(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, {
    perforated,
    house: isLevelProduct(tpl),
  });
  const isHH = !!mats.frame.userData.hh;
  const wheelR = 0.04;
  // the frame is lifted by the height of the wheels
  const inner = new THREE.Group();
  inner.position.y = isHH ? hhCasterH(p) : wheelR * 2;
  addPosts(inner, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  addTierBoards(inner, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    frameMat: mats.frame,
  });
  group.add(inner);
  if (isHH) {
    addHHCasters(group, inner, w, d, hhCasterH(p));
    return;
  }
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.025, 16);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.6,
  });
  const wheelOffset = 0.04;
  [
    [-w / 2 + wheelOffset, wheelR, -d / 2 + wheelOffset],
    [w / 2 - wheelOffset, wheelR, -d / 2 + wheelOffset],
    [-w / 2 + wheelOffset, wheelR, d / 2 - wheelOffset],
    [w / 2 - wheelOffset, wheelR, d / 2 - wheelOffset],
  ].forEach((pos) => {
    const wm = new THREE.Mesh(wheelGeo, wheelMat);
    wm.rotation.z = Math.PI / 2;
    wm.position.set(pos[0], pos[1], pos[2]);
    group.add(wm);
  });
}

/* --- Curtain fabric texture: vertical pleats / drape shading ---
   Produces the soft pleated look of a real pipe-and-drape booth curtain
   (matches the reference photo). Cached as one shared texture; callers
   clone it and set repeat to suit each panel's width.                  */
let _curtainTex = null;
function makeCurtainTexture() {
  if (_curtainTex) return _curtainTex;
  const W = 256,
    H = 256;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');

  // base fabric tone — a neutral warm grey like the reference drape
  ctx.fillStyle = '#9a9893';
  ctx.fillRect(0, 0, W, H);

  // vertical pleats: alternating light/shadow bands down the fabric
  const pleats = 18;
  const pw = W / pleats;
  for (let i = 0; i < pleats; i++) {
    const x = i * pw;
    // each pleat = a soft gradient from shadow (fold) to highlight (crest)
    const g = ctx.createLinearGradient(x, 0, x + pw, 0);
    g.addColorStop(0.0, 'rgba(60,58,55,0.55)'); // deep fold
    g.addColorStop(0.35, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.22)'); // crest highlight
    g.addColorStop(0.65, 'rgba(255,255,255,0.10)');
    g.addColorStop(1.0, 'rgba(60,58,55,0.55)'); // deep fold
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, pw, H);
  }

  // faint horizontal weave noise so the fabric isn't perfectly smooth
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  _curtainTex = tex;
  return tex;
}

/* --- Pegboard panel texture: regular grid of small holes --- */
let _pegTexCache = {};
function makePegboardTexture(isBlack) {
  const key = isBlack ? 'b' : 'w';
  if (_pegTexCache[key]) return _pegTexCache[key];
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  // panel base color
  ctx.fillStyle = isBlack ? '#303033' : '#e4e4e4';
  ctx.fillRect(0, 0, S, S);
  // grid of holes — 8x8 per tile
  const n = 8,
    pitch = S / n;
  ctx.fillStyle = isBlack ? 'rgba(0,0,0,0.92)' : 'rgba(120,120,120,0.85)';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      ctx.beginPath();
      ctx.arc(
        pitch * (i + 0.5),
        pitch * (j + 0.5),
        pitch * 0.18,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  _pegTexCache[key] = tex;
  return tex;
}

/* Perforated beam: a tall plate (180 mm) with five rows of round holes at
   a 25 mm pitch, used in place of an ordinary beam.                    */
const HH_PERF_H = 0.18;
function hhPerfMaterial(len, height, hex, hanging = false) {
  const cols = Math.floor((len - 0.09) / 0.025) + 1;
  // holes from 27 mm below the top edge down to the beam's plain band
  const rows = Math.max(1, Math.floor((height - 0.077) / 0.025) + 1);
  const tex = labelTexture(`perf${Math.round(len * 1000)}x${Math.round(height * 1000)}${hanging ? 'h' : ''}`, Math.min(2048, Math.round(len * 2400)), Math.min(2048, Math.round(height * 2400)), (x, cw, ch) => {
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, cw, ch);
    x.globalCompositeOperation = 'destination-out';
    const px = cw / len,
      py = ch / height;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        x.beginPath();
        const y = (0.027 + r * 0.025) * py;
        x.ellipse(cw / 2 + (c - (cols - 1) / 2) * 0.025 * px, hanging ? ch - y : y, 0.0032 * px, 0.0032 * py, 0, 0, Math.PI * 2);
        x.fill();
      }
  });
  tex.anisotropy = 8;
  return new THREE.MeshStandardMaterial({
    color: hex,
    map: tex,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0,
  });
}
/* HOMEDANT HOUSE perforated trolley (from the product CAD, 300/400 x 600
   x 900): four posts on casters, tray levels with a flat top, perforated
   beams around three sides of the level below the top, and a push
   handle at one end.                                                   */
function buildHHTrolley(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const { flange: F, postT: T, sheet: t, beamH: BH } = HH;
  const mats = makeMaterials(p, { house: true });
  const tiers = p.tier || tpl.defaultTier;
  // perforated beams (perforated trolley only): back and both ends of
  // the level under the top, rising from it
  const lv = hhResolveLevels(p, tiers);
  if (tpl.perforated && tiers >= 2) {
    const L = lv[tiers - 2],
      N = lv[tiers - 1];
    const beamBottom = L.h * MM_TO_M - (L.style === 'basket' ? 0 : 0.009) - BH;
    const room = N.h * MM_TO_M - BH - 0.009 - 0.02 - beamBottom;
    const ph = Math.min(HH_PERF_H, room);
    if (ph >= 0.16) {
      mats.frame.userData.hh.perf = { [tiers - 2]: ph };
      mats.frame.userData.hh.perfUp = true;
    }
  }
  const inner = new THREE.Group();
  inner.position.y = hhCasterH(p);
  addPosts(inner, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  addTierBoards(inner, w, d, h, tiers, mats.board, { frameMat: mats.frame });
  group.add(inner);
  addHHCasters(group, inner, w, d, hhCasterH(p));

  // push handle: a moulded bracket over each post top at one end, and a
  // tube between them
  const prof = new THREE.Shape();
  prof.moveTo(-F - 0.002, 0);
  prof.lineTo(-F - 0.002, 0.008);
  prof.lineTo(0, 0.008);
  prof.quadraticCurveTo(0.03, 0.012, 0.046, 0.038);
  prof.absarc(0.046, 0.017, 0.021, Math.PI / 2, -Math.PI / 2, true);
  prof.quadraticCurveTo(0.02, -0.02, 0.0015, -0.07);
  prof.lineTo(0.0015, 0);
  const bracketGeo = new THREE.ExtrudeGeometry(prof, { depth: 0.05, bevelEnabled: false, curveSegments: 14 });
  bracketGeo.translate(0, 0, -0.025);
  const plastic = new THREE.MeshStandardMaterial({ color: mats.frameHex, roughness: 0.6, metalness: 0 });
  [-1, 1].forEach((sz) => hhAdd(inner, bracketGeo, plastic, w / 2, h, sz * (d / 2 - F / 2)));
  const tube = new THREE.CylinderGeometry(0.0125, 0.0125, d - F, 20);
  tube.rotateX(Math.PI / 2);
  hhAdd(
    inner,
    tube,
    plastic, // the tube follows the frame colour too: white or black
    w / 2 + 0.046,
    h + 0.017,
    0
  );
}

/* Perforated steel sheet, 25 mm hole pitch, as a repeating tile so any
   panel size can use it. tile = 4 x 4 holes = 100 mm square.           */
function hhPegPanelMaterial(w, h, hex) {
  const tex = labelTexture('pegtile', 256, 256, (x, cw, ch) => {
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, cw, ch);
    x.globalCompositeOperation = 'destination-out';
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        x.beginPath();
        x.arc((c + 0.5) * 64, (r + 0.5) * 64, 9, 0, Math.PI * 2);
        x.fill();
      }
  }).clone();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 0.1, h / 0.1);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    color: hex,
    map: tex,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0,
  });
}
/* HOMEDANT HOUSE pegboard shelf: an ordinary shelf whose back and end
   beams are perforated beams. Like the perforated trolley's (CAD: 180 mm
   plate covering 170 of the 253 mm between two levels), each one covers
   about two thirds of the bay, but here it hangs from the level above,
   so the top of each bay is closed and the bottom is open.            */
const HH_PERF_RATIO = 170 / 253;
function hhPerfDrops(p, tiers) {
  const { beamH: BH, sheet: t } = HH;
  const lv = hhResolveLevels(p, tiers);
  const out = {};
  for (let i = 1; i < tiers; i++) {
    const L = lv[i - 1],
      N = lv[i];
    const boardTop = L.style === 'basket' ? L.h * MM_TO_M - BH + t + 0.009 : L.h * MM_TO_M;
    const beamTop = N.h * MM_TO_M - (N.style === 'basket' ? 0 : 0.009);
    const clear = beamTop - BH - boardTop;
    out[i] = BH + clear * HH_PERF_RATIO;
  }
  return out;
}
function buildHHPegShelf(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const mats = makeMaterials(p, { house: true });
  const tiers = p.tier || tpl.defaultTier;
  mats.frame.userData.hh.perf = hhPerfDrops(p, tiers);
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  addTierBoards(group, w, d, h, tiers, mats.board, { frameMat: mats.frame });
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildPegboard(group, p, tpl) {
  if (tpl.brand === 'HOMEDANT HOUSE') return buildHHPegShelf(group, p, tpl);
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, {
    perforated,
    house: tpl.brand === 'HOMEDANT HOUSE',
  });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  addTierBoards(group, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    frameMat: mats.frame,
  });

  // --- pegboard panels mounted in the back, one per open bay ---
  const isBlack = p.frameColor === 'black';
  const pegTex = makePegboardTexture(isBlack).clone();
  pegTex.wrapS = pegTex.wrapT = THREE.RepeatWrapping;
  pegTex.needsUpdate = true;
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: pegTex,
    metalness: 0.25,
    roughness: 0.7,
  });

  const tiers = p.tier || tpl.defaultTier;
  // place a pegboard panel in each gap between consecutive boards
  const panelW = w - 0.07;
  const bayCount = Math.max(1, tiers - 1);
  // repeat the hole texture proportionally to the panel size
  pegTex.repeat.set(
    Math.max(2, Math.round(panelW * 6)),
    Math.max(2, Math.round((h / bayCount) * 6))
  );

  const yBottom = 0.05;
  const yTop = h - 0.05;
  for (let i = 0; i < bayCount; i++) {
    const y0 = yBottom + (i / bayCount) * (yTop - yBottom);
    const y1 = yBottom + ((i + 1) / bayCount) * (yTop - yBottom);
    const bayH = y1 - y0 - 0.04;
    const panelGeo = new THREE.BoxGeometry(panelW, bayH, 0.006);
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, (y0 + y1) / 2, -d / 2 + 0.022);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

/* HOMEDANT HOUSE drawer hanger (from the product CAD, 800 x 500 x 2100):
   two steel drawers at the bottom with a board over them, open hanging
   space above, and a top board with the hanger bar under it.           */
function buildHHDrawerHanger(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const { flange: F, postT: T, sheet: t, beamH: BH } = HH;
  const mats = makeMaterials(p, { house: true });
  const hh = mats.frame.userData.hh;
  hh.barLevels = [1];
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  addTierBoards(group, w, d, h, 2, mats.board, { frameMat: mats.frame });
  addHHHangerBar(group, w, d, mats.frame, 2, 1);

  // beams with no board: front and back at the floor, and the side
  // beams that carry the drawer rails
  const plateX = new THREE.BoxGeometry(w - 2 * T, BH, t);
  const plateZ = new THREE.BoxGeometry(t, BH, d - 2 * T - 2 * t);
  [-1, 1].forEach((s) => {
    hhAdd(group, plateX, mats.frame, 0, 0.03 + BH / 2, s * (d / 2 - T - t / 2));
    [0.09, 0.27].forEach((y) => hhAdd(group, plateZ, mats.frame, s * (w / 2 - T - t / 2), y + BH / 2, 0));
  });

  // drawers: painted steel like the frame, a bar handle on each front
  const paint = new THREE.MeshStandardMaterial({
    color: mats.frameHex,
    metalness: mats.frame.metalness,
    roughness: mats.frame.roughness,
  });
  const fw = w - 0.082,
    fh = 0.175,
    zf = d / 2 - 0.006; // front face
  const front = new THREE.BoxGeometry(fw, fh, 0.016);
  const box = new THREE.BoxGeometry(fw - 0.016, 0.16, d - 0.03);
  const bar = new THREE.CylinderGeometry(0.005, 0.005, 0.139, 12);
  bar.rotateZ(Math.PI / 2);
  const post = new THREE.CylinderGeometry(0.004, 0.004, 0.02, 10);
  post.rotateX(Math.PI / 2);
  [0.093, 0.273].forEach((y0) => {
    hhAdd(group, front, paint, 0, y0 + fh / 2, zf - 0.008);
    hhAdd(group, box, paint, 0, y0 + 0.006 + 0.08, zf - 0.016 - (d - 0.03) / 2);
    hhAdd(group, bar, paint, 0, y0 + fh / 2, zf + 0.02);
    [-0.06, 0.06].forEach((x) => hhAdd(group, post, paint, x, y0 + fh / 2, zf + 0.01));
  });

  // 2100 posts are two 1050 lengths joined by a sleeve at mid height
  if (p.height === 2100) {
    const sx = new THREE.BoxGeometry(F + 0.003, 0.134, 0.0015);
    const sz = new THREE.BoxGeometry(0.0015, 0.134, F + 0.003);
    [-1, 1].forEach((a) =>
      [-1, 1].forEach((b) => {
        hhAdd(group, sx, mats.frame, a * (w / 2 - F / 2), 1.049, b * (d / 2 + 0.0008));
        hhAdd(group, sz, mats.frame, a * (w / 2 + 0.0008), 1.049, b * (d / 2 - F / 2));
      })
    );
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildDrawer(group, p, tpl) {
  if (tpl.brand === 'HOMEDANT HOUSE') return buildHHDrawerHanger(group, p, tpl);
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, {
    perforated,
    house: tpl.brand === 'HOMEDANT HOUSE',
  });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  // Drawer shelf has NO middle/bottom boards — only ONE board at the very
  // top (with its 4-side support beams). The drawers below act as the
  // structure, and the bottom of the lowest drawer serves as the base.
  addBoardWithBeams(group, w, d, h - 0.009 / 2, mats.board, mats.frame);

  // --- metal drawer stack in the lower half ---
  // Three stacked steel drawers with recessed fronts + handle bars,
  // so it reads as a real drawer unit rather than plain boxes.
  const drawerCount = 3;
  // shelf section : drawer section = 5 : 2  → drawers occupy 2/7 of height
  const stackTop = h * (2 / 7); // drawers occupy lower 2/7
  const stackBot = 0.02; // sit closer to the ground
  const stackH = stackTop - stackBot;
  const drawerH = stackH / drawerCount;
  const bodyW = w - 0.06;
  const bodyD = d - 0.06;

  // drawer color follows the frame: white frame → matte white drawers,
  // black frame → matte black drawers. Low metalness + high roughness
  // keeps it a flat matte paint finish (not shiny steel) either way.
  const isWhite = p.frameColor === 'white';
  const drawerBodyHex = isWhite ? 0xffffff : 0x2a2a2e; // matches FRAME_COLORS
  const drawerFrontHex = isWhite ? 0xffffff : 0x2a2a2e;
  const drawerBodyMat = new THREE.MeshStandardMaterial({
    color: drawerBodyHex,
    metalness: 0.05,
    roughness: 0.85,
  });
  const drawerFrontMat = new THREE.MeshStandardMaterial({
    color: drawerFrontHex,
    metalness: 0.05,
    roughness: 0.82,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xbdbdbd : 0x8a8a8a,
    metalness: 0.45,
    roughness: 0.5,
  });

  for (let i = 0; i < drawerCount; i++) {
    const yc = stackBot + drawerH * (i + 0.5);
    // drawer body — fills the full drawer height so there is NO gap
    // between stacked drawers (only inset on width/depth, not height)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW - 0.02, drawerH, bodyD - 0.02),
      drawerBodyMat
    );
    body.position.set(0, yc, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    // raised front panel — also full drawer height, drawers touch flush
    const front = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW, drawerH, 0.014),
      drawerFrontMat
    );
    front.position.set(0, yc, d / 2 - 0.03);
    front.castShadow = true;
    group.add(front);
    // handle bar across the front
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, bodyW * 0.45, 10),
      handleMat
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, yc + drawerH * 0.18, d / 2 - 0.02);
    group.add(handle);
    // two small handle stand-offs
    [-bodyW * 0.22, bodyW * 0.22].forEach((hx) => {
      const sx = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.01, 0.012),
        handleMat
      );
      sx.position.set(hx, yc + drawerH * 0.18, d / 2 - 0.028);
      group.add(sx);
    });
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildCabinet(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, {
    perforated,
    house: tpl.brand === 'HOMEDANT HOUSE',
  });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });

  // The upper section stays open shelving. The cabinet occupies the
  // lower ~30% with a 2-sliding-door front + wood side panels.
  const tiers = p.tier || tpl.defaultTier;
  // Render the tier boards but skip the very bottom (cabinet sits there).
  addTierBoards(group, w, d, h, tiers, mats.board, {
    skipBottom: true,
    frameMat: mats.frame,
  });

  // --- lower cabinet box ---
  const cabH = h * 0.3;
  const cabTopY = cabH; // top of the cabinet
  const bodyW = w - 0.05;
  const bodyD = d - 0.05;

  // door color rule: white frame -> mint, black frame -> dark green
  const isWhite = p.frameColor === 'white';
  const doorColor = isWhite ? 0x9fd8cf : 0x4f6b4a; // mint / dark green
  const doorMat = new THREE.MeshStandardMaterial({
    color: doorColor,
    metalness: 0.15,
    roughness: 0.55,
  });
  // wood side panels (use the shared wood texture for consistency)
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.7,
  });
  {
    sideMat.map = makeWoodTexture().clone();
  }

  // cabinet top board (wood) — gives the "tabletop" surface
  const topGeo = new THREE.BoxGeometry(bodyW, 0.014, bodyD);
  const topBoard = new THREE.Mesh(topGeo, mats.board);
  topBoard.position.set(0, cabTopY - 0.007, 0);
  topBoard.castShadow = true;
  topBoard.receiveShadow = true;
  group.add(topBoard);

  // two wood side panels
  const sideGeo = new THREE.BoxGeometry(0.014, cabH - 0.02, bodyD);
  [-bodyW / 2 + 0.007, bodyW / 2 - 0.007].forEach((sx) => {
    const s = new THREE.Mesh(sideGeo, sideMat);
    s.position.set(sx, cabH / 2, 0);
    s.castShadow = true;
    s.receiveShadow = true;
    group.add(s);
  });

  // back panel (frame colour)
  const backGeo = new THREE.BoxGeometry(bodyW - 0.028, cabH - 0.02, 0.01);
  const back = new THREE.Mesh(backGeo, mats.frame);
  back.position.set(0, cabH / 2, -bodyD / 2 + 0.006);
  group.add(back);

  // two sliding doors on the front, slightly overlapping in the middle
  const doorW = (bodyW - 0.028) / 2 + 0.012;
  const doorH = cabH - 0.045;
  const doorGeo = new THREE.BoxGeometry(doorW, doorH, 0.012);
  const doorL = new THREE.Mesh(doorGeo, doorMat);
  doorL.position.set(-bodyW / 4 + 0.006, cabH / 2, bodyD / 2 - 0.01);
  doorL.castShadow = true;
  group.add(doorL);
  const doorR = new THREE.Mesh(doorGeo, doorMat);
  doorR.position.set(bodyW / 4 - 0.006, cabH / 2, bodyD / 2 - 0.022);
  doorR.castShadow = true;
  group.add(doorR);

  // small round door handles
  const handleMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0x888888 : 0x111111,
    metalness: 0.6,
    roughness: 0.4,
  });
  const hGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.012, 12);
  const h1 = new THREE.Mesh(hGeo, handleMat);
  h1.rotation.x = Math.PI / 2;
  h1.position.set(-0.03, cabH / 2, bodyD / 2 - 0.002);
  group.add(h1);
  const h2 = new THREE.Mesh(hGeo, handleMat);
  h2.rotation.x = Math.PI / 2;
  h2.position.set(0.03, cabH / 2, bodyD / 2 - 0.014);
  group.add(h2);

  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildFrameOpen(group, p, tpl) {
  // washing machine shelf - basically a frame around an open space
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, {
    perforated,
    house: tpl.brand === 'HOMEDANT HOUSE',
  });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  // top board only + maybe a middle/lower shelf, all with 4-side support beams
  const tiers = p.tier || tpl.defaultTier;
  if (tiers >= 1) {
    addBoardWithBeams(group, w, d, h - 0.009, mats.board, mats.frame);
  }
  if (tiers >= 2) {
    addBoardWithBeams(group, w, d, h * 0.6, mats.board, mats.frame);
  }
  if (tiers >= 3) {
    addBoardWithBeams(group, w, d, h * 0.3, mats.board, mats.frame);
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildHeavy(group, p, tpl) {
  // similar to shelf but thicker posts and thicker support beams
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, {
    perforated,
    house: tpl.brand === 'HOMEDANT HOUSE',
  });
  addPosts(group, w, d, h, mats.frame, 0.04, { postMat: mats.postMat });
  addTierBoards(group, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    postSize: 0.04,
    thickness: 0.013,
    beamH: 0.045,
    beamW: 0.028,
    frameMat: mats.frame,
  });
  addPostFeet(group, w, d, mats.foot, 0.04);
}

/* Roll-up banner graphic, drawn once on a canvas: headline, a dotted
   world map, the HOMEDANT wordmark. The wordmark is an image, so it is
   painted in when it has loaded and the texture refreshed.            */
let _bannerTex = null;
function makeBannerTexture() {
  if (_bannerTex) return _bannerTex;
  const W = 512,
    H = 1280;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 84px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#c62828';
  ctx.fillText('TRUSTED', 40, 190);
  ctx.fillStyle = '#1c1c1c';
  ctx.font = '800 70px Arial, Helvetica, sans-serif';
  ctx.fillText('WORLDWIDE', 40, 268);
  ctx.fillStyle = '#555555';
  ctx.font = '400 34px Arial, Helvetica, sans-serif';
  ctx.fillText('in Storage Solution', 40, 322);
  // dotted world map: rough continent blobs filled with a dot grid
  const blobs = [
    [0.2, 0.33, 0.17, 0.22],
    [0.29, 0.76, 0.07, 0.2],
    [0.5, 0.27, 0.07, 0.13],
    [0.53, 0.6, 0.09, 0.22],
    [0.73, 0.33, 0.2, 0.2],
    [0.86, 0.8, 0.07, 0.08],
  ];
  const mx = 40,
    my = 420,
    mw = 432,
    mh = 250;
  ctx.fillStyle = '#b9bdc3';
  for (let y = 0; y <= mh; y += 10)
    for (let x = 0; x <= mw; x += 10) {
      const u = x / mw,
        v = y / mh;
      if (blobs.some(([cx, cy, rx, ry]) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1)) {
        ctx.beginPath();
        ctx.arc(mx + x, my + y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  ctx.fillStyle = '#c62828';
  [
    [0.2, 0.36],
    [0.5, 0.28],
    [0.74, 0.4],
    [0.8, 0.3],
    [0.86, 0.8],
  ].forEach(([u, v]) => {
    ctx.beginPath();
    ctx.arc(mx + u * mw, my + v * mh, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillRect(0, H - 46, W, 46); // red foot band
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    const lw = 360,
      lh = lw / HOMEDANT_WORDMARK_ASPECT;
    ctx.drawImage(img, (W - lw) / 2, 1080, lw, lh);
    tex.needsUpdate = true;
    _bannerClones.forEach((c) => {
      c.needsUpdate = true;
    });
    _bannerClones.clear();
    _bannerReady = true;
  };
  img.src = HOMEDANT_WORDMARK_URL;
  _bannerTex = tex;
  return tex;
}
let _bannerReady = false;
const _bannerClones = new Set();

function buildBanner(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const metal = new THREE.MeshStandardMaterial({
    color: 0x8d9197,
    metalness: 0.3,
    roughness: 0.4,
  });
  const add = (geo, m, x, y, z) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };
  // cassette on the floor with two swing-out feet, and the rear pole
  add(new THREE.BoxGeometry(w, 0.07, 0.09), metal, 0, 0.045, 0);
  [-w / 2 + 0.08, w / 2 - 0.08].forEach((x) =>
    add(new THREE.BoxGeometry(0.035, 0.012, Math.max(0.2, d)), metal, x, 0.006, 0)
  );
  add(new THREE.CylinderGeometry(0.008, 0.008, h - 0.05, 8), metal, 0, h / 2 + 0.02, -0.025);
  add(new THREE.BoxGeometry(w, 0.025, 0.018), metal, 0, h - 0.0125, 0);
  // printed panel: graphic on the front, plain white behind
  const tex = makeBannerTexture().clone();
  tex.needsUpdate = true;
  if (!_bannerReady) _bannerClones.add(tex);
  const front = new THREE.MeshStandardMaterial({ map: tex, color: 0xdddddd, roughness: 0.8 });
  const plain = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.8 });
  const ph = h - 0.105;
  add(
    new THREE.BoxGeometry(w * 0.98, ph, 0.003),
    [plain, plain, plain, plain, front, plain],
    0,
    0.08 + ph / 2,
    0.004
  );
}

/* Table dressed in a blush cloth to the floor with the logo on the front */
function buildLogoTable(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const cloth = new THREE.MeshStandardMaterial({ color: 0xcdb3ad, roughness: 1 });
  const clothTop = new THREE.MeshStandardMaterial({ color: 0xa8928d, roughness: 1 });
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.01, d), cloth);
  skirt.position.set(0, (h - 0.01) / 2, 0);
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  group.add(skirt);
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.006, 0.012, d + 0.006), clothTop);
  top.position.set(0, h - 0.006, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  const sign = makeLogoSign(Math.min(w * 0.5, 0.8));
  sign.position.set(0, h * 0.52, d / 2 + 0.002);
  group.add(sign);
}

function buildPoster(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
  });
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.85,
  });
  // 2 legs
  const legGeo = new THREE.BoxGeometry(0.04, h, 0.04);
  const l1 = new THREE.Mesh(legGeo, frameMat);
  l1.position.set(-w / 2 + 0.02, h / 2, 0);
  group.add(l1);
  const l2 = new THREE.Mesh(legGeo, frameMat);
  l2.position.set(w / 2 - 0.02, h / 2, 0);
  group.add(l2);
  // poster panel
  const pGeo = new THREE.BoxGeometry(w - 0.05, h * 0.85, Math.max(d, 0.02));
  const poster = new THREE.Mesh(pGeo, paperMat);
  poster.position.set(0, h * 0.5, 0);
  group.add(poster);
}

function buildTable(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.5,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: BOARD_COLORS[p.boardColor] || 0xa07853,
    roughness: 0.8,
  });
  const legSize = 0.04;
  const legGeo = new THREE.BoxGeometry(legSize, h - 0.03, legSize);
  const positions = [
    [-w / 2 + legSize, (h - 0.03) / 2, -d / 2 + legSize],
    [w / 2 - legSize, (h - 0.03) / 2, -d / 2 + legSize],
    [-w / 2 + legSize, (h - 0.03) / 2, d / 2 - legSize],
    [w / 2 - legSize, (h - 0.03) / 2, d / 2 - legSize],
  ];
  positions.forEach((pos) => {
    const m = new THREE.Mesh(legGeo, legMat);
    m.position.set(pos[0], pos[1], pos[2]);
    group.add(m);
  });
  const topGeo = new THREE.BoxGeometry(w, 0.03, d);
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(0, h - 0.015, 0);
  group.add(top);
}

function buildChair(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const seatH = h * 0.5;
  const mat = new THREE.MeshStandardMaterial({
    color: p.boardColor === 'white' ? 0xeeeeee : 0x222222,
    roughness: 0.7,
  });
  const legGeo = new THREE.BoxGeometry(0.03, seatH, 0.03);
  [
    [-w / 2 + 0.04, seatH / 2, -d / 2 + 0.04],
    [w / 2 - 0.04, seatH / 2, -d / 2 + 0.04],
    [-w / 2 + 0.04, seatH / 2, d / 2 - 0.04],
    [w / 2 - 0.04, seatH / 2, d / 2 - 0.04],
  ].forEach((pos) => {
    const m = new THREE.Mesh(legGeo, mat);
    m.position.set(pos[0], pos[1], pos[2]);
    group.add(m);
  });
  const seatGeo = new THREE.BoxGeometry(w, 0.04, d);
  const seat = new THREE.Mesh(seatGeo, mat);
  seat.position.set(0, seatH + 0.02, 0);
  group.add(seat);
  const backGeo = new THREE.BoxGeometry(w, h - seatH, 0.04);
  const back = new THREE.Mesh(backGeo, mat);
  back.position.set(0, seatH + (h - seatH) / 2, -d / 2 + 0.02);
  group.add(back);
}

function buildCatalogStand(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.5,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: BOARD_COLORS[p.boardColor] || 0xa07853,
    roughness: 0.7,
  });
  // base
  const baseGeo = new THREE.BoxGeometry(w, 0.03, d);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, 0.015, 0);
  group.add(base);
  // pole
  const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, h - 0.03, 12);
  const pole = new THREE.Mesh(poleGeo, mat);
  pole.position.set(0, (h - 0.03) / 2 + 0.03, 0);
  group.add(pole);
  // 3 angled trays
  const trayGeo = new THREE.BoxGeometry(w * 0.85, 0.02, d * 0.7);
  for (let i = 0; i < 3; i++) {
    const tray = new THREE.Mesh(trayGeo, baseMat);
    tray.position.set(0, h * (0.4 + i * 0.2), 0);
    tray.rotation.x = -Math.PI / 12;
    group.add(tray);
  }
}

/* A cartoon booth staff member: big head, simple face, a lanyard name
   tag. Not a likeness of anyone; the name tag, glasses, shirt and hair
   are set in the side panel so the figure can be dressed up for fun.  */
const STAFF_SHIRTS = { navy: 0x26324a, black: 0x1d1e21, white: 0xe9e9e6, grey: 0x7d8086, blue: 0x5b83b8 };
function buildStaff(group, p, tpl) {
  // fixed look: brown hair parted just off centre with the fringe swept
  // to both sides, round black glasses, and a dark suit with white shirt
  // and tie
  const coat = tpl && tpl.preset === 'coat';
  if (coat) p = { ...p, staffGlasses: true, staffName: p.staffName ?? '이과장' };
  const H = p.height * MM_TO_M;
  const k = H / 1.75;
  const g = new THREE.Group();
  g.scale.setScalar(k);
  group.add(g);
  const mat = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
  const add = (parent, geo, m, x, y, z) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const skin = mat(0xd9ad8c, 0.7);
  const shirt = coat ? mat(0x2a2f3a, 0.8) : mat(STAFF_SHIRTS[p.staffShirt] || STAFF_SHIRTS.navy, 0.9);
  const pants = coat ? shirt : mat(0x2b2e35, 0.9);
  const shoe = mat(0x161616, 0.5);
  const hair = mat(coat ? 0x4a3325 : 0x1b1714, 0.8);
  const white = mat(0xeeeeec, 0.8);
  const tie = mat(0x3a2a4a, 0.6);
  if (coat) shirt.side = THREE.DoubleSide;
  const dark = mat(0x111111, 0.4);

  // legs and shoes
  [-0.09, 0.09].forEach((x) => {
    add(g, new THREE.CylinderGeometry(0.068, 0.058, 0.78, 14), pants, x, 0.43, 0);
    const sh = add(g, new THREE.BoxGeometry(0.1, 0.06, 0.2), shoe, x, 0.03, 0.03);
    sh.geometry.translate(0, 0, 0);
  });
  // body
  if (coat) {
    // white shirt and tie, seen in the V of the jacket
    const inner = add(g, new THREE.CylinderGeometry(0.19, 0.165, 0.58, 20), white, 0, 1.07, 0);
    inner.scale.z = 0.6;
    add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.07, 14), skin, 0, 1.385, 0); // neck
    [-1, 1].forEach((s) => {
      const c = add(g, new THREE.BoxGeometry(0.08, 0.05, 0.012), white, s * 0.04, 1.34, 0.108);
      c.rotation.z = s * 0.6;
    });
    add(g, new THREE.BoxGeometry(0.035, 0.03, 0.02), tie, 0, 1.325, 0.112); // knot
    const blade = add(g, new THREE.CylinderGeometry(0.024, 0.036, 0.3, 4), tie, 0, 1.16, 0.114);
    blade.rotation.y = Math.PI / 4;
    blade.scale.z = 0.25;
    // jacket: buttoned, open in a V at the chest, down to the hip
    const gap = 0.3;
    const shell = add(g, new THREE.CylinderGeometry(0.212, 0.2, 0.6, 28, 1, true, gap, Math.PI * 2 - 2 * gap), shirt, 0, 1.08, 0);
    shell.scale.z = 0.64;
    const lower = add(g, new THREE.CylinderGeometry(0.2, 0.205, 0.2, 28), shirt, 0, 0.87, 0); // closed below the button
    lower.scale.z = 0.64;
    add(g, new THREE.CylinderGeometry(0.1, 0.212, 0.04, 28), shirt, 0, 1.39, 0).scale.z = 0.64; // shoulders
    [-1, 1].forEach((s) => {
      const lap = add(g, new THREE.BoxGeometry(0.06, 0.3, 0.012), shirt, s * 0.07, 1.2, 0.128);
      lap.rotation.set(-0.1, s * 0.3, s * 0.28);
    });
    add(g, new THREE.SphereGeometry(0.011, 10, 8), mat(0x111111, 0.4), 0, 0.99, 0.133); // button
  } else {
    const torso = add(g, new THREE.CylinderGeometry(0.2, 0.17, 0.56, 20), shirt, 0, 1.08, 0);
    torso.scale.z = 0.62;
    add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.07, 14), skin, 0, 1.38, 0); // neck
    // collar
    [-1, 1].forEach((s) => {
      const c = add(g, new THREE.BoxGeometry(0.09, 0.05, 0.012), shirt, s * 0.045, 1.335, 0.105);
      c.rotation.z = s * 0.55;
    });
  }
  // arms: left down, right raised in a wave
  const armGeo = new THREE.CylinderGeometry(0.048, 0.04, 0.56, 12);
  armGeo.translate(0, -0.28, 0);
  const handGeo = new THREE.SphereGeometry(0.05, 12, 10);
  const armL = add(g, armGeo, shirt, -0.235, 1.33, 0);
  armL.rotation.z = -0.12;
  add(armL, handGeo, skin, 0, -0.6, 0);
  const armR = add(g, armGeo, shirt, 0.235, 1.33, 0);
  armR.rotation.z = 2.55;
  add(armR, handGeo, skin, 0, -0.6, 0);

  // head: larger than life, for a cartoon look
  const head = new THREE.Group();
  head.position.set(0, 1.6, 0);
  g.add(head);
  const R = 0.165;
  const face = add(head, new THREE.SphereGeometry(R, 32, 24), skin, 0, 0, 0);
  face.scale.set(1, 1.08, 0.98);
  [-1, 1].forEach((s) => add(head, new THREE.SphereGeometry(0.035, 12, 10), skin, s * R * 0.98, -0.01, 0));
  // hair cap
  const cap = add(head, new THREE.SphereGeometry(R * 1.07, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48), hair, 0, 0.012, -0.012);
  cap.rotation.x = -0.32;
  cap.scale.set(1, 1.05, 1);
  if (coat) {
    cap.visible = false;
    // Side parting (가르마): a line on top of the head a little to the left
    // as you face him. From that line the hair is combed two ways: a big
    // sweep falls diagonally across the forehead to the right temple, and
    // a shorter side falls to the left, so the forehead shows as a
    // triangle under the parting.
    const full = R * 1.12;
    const SC = [1.04, 1.1, 1.04],
      OFF = [0, 0.008, -0.006];
    hair.side = THREE.DoubleSide;
    const onHead = (r, ph, th) => [
      -r * Math.cos(ph) * Math.sin(th) * SC[0] + OFF[0],
      r * Math.cos(th) * SC[1] + OFF[1],
      r * Math.sin(ph) * Math.sin(th) * SC[2] + OFF[2],
    ];
    // a patch of the hair shell between two angles round the head, each
    // column running from the crown down to where that column ends
    const patch = (r, ph0, ph1, end, nPh = 48, nTh = 14) => {
      const pos = [],
        nor = [],
        idx = [];
      for (let i = 0; i <= nPh; i++) {
        const ph = ph0 + ((ph1 - ph0) * i) / nPh;
        const te = end(ph);
        for (let j = 0; j <= nTh; j++) {
          const th = (te * j) / nTh;
          const v = onHead(r, ph, th);
          pos.push(...v);
          const n = new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th));
          nor.push(n.x, n.y, n.z);
        }
      }
      for (let i = 0; i < nPh; i++)
        for (let j = 0; j < nTh; j++) {
          const a0 = i * (nTh + 1) + j,
            b0 = a0 + nTh + 1;
          idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      geo.setIndex(idx);
      return add(head, geo, hair, 0, 0, 0);
    };
    const partPhi = Math.PI / 2 - 0.24; // left of centre as you face him
    const top = Math.PI * 0.1; // the hairline at the parting
    // big side: drops fast from the parting, then runs along the brow
    patch(full * 1.01, partPhi, partPhi + 1.5, (ph) => {
      const u = Math.min(1, (ph - partPhi) / 0.85);
      return top + Math.PI * (0.31 * (1 - (1 - u) * (1 - u)) + (ph - partPhi > 1.1 ? 0.06 : 0));
    });
    // short side: a gentler slope down to the left temple
    patch(full * 1.01, partPhi - 1.45, partPhi, (ph) => {
      const u = Math.min(1, (partPhi - ph) / 0.6);
      return top + Math.PI * (0.3 * (1 - (1 - u) * (1 - u)) + (partPhi - ph > 1.15 ? 0.06 : 0));
    });
    // back and sides, down past the ears
    patch(full, partPhi + 1.4, partPhi - 1.35 + Math.PI * 2, () => Math.PI * 0.6, 40, 16);
    // the parting line itself, from the hairline back over the crown
    const seam = [];
    for (let k = 0; k <= 8; k++) seam.push(new THREE.Vector3(...onHead(full * 1.025, partPhi, top * (1 - k / 8) + 0.02)));
    add(head, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam), 16, 0.0028, 6), mat(0x24170f, 0.9), 0, 0, 0);
    // volume where the big side lifts off the parting and rolls over
    const roll = add(head, new THREE.SphereGeometry(R * 0.42, 18, 12), hair, 0.05, R * 0.86, R * 0.42);
    roll.scale.set(1.35, 0.42, 0.85);
    roll.rotation.set(0.35, 0, -0.42);
  } else if (p.staffHair === 'parted') {
    const sweep = add(head, new THREE.SphereGeometry(R * 0.62, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), hair, -0.05, R * 0.72, R * 0.42);
    sweep.rotation.set(0.55, 0, 0.35);
    sweep.scale.set(1.25, 0.45, 0.8);
  } else {
    const fringe = add(head, new THREE.BoxGeometry(R * 1.5, 0.035, 0.05), hair, 0, R * 0.62, R * 0.7);
    fringe.rotation.x = 0.5;
  }
  // eyes, brows, nose, smile
  const zf = R * 0.93;
  [-1, 1].forEach((s) => {
    add(head, new THREE.SphereGeometry(0.017, 12, 10), dark, s * 0.055, 0.02, zf);
    const brow = add(head, new THREE.BoxGeometry(0.05, 0.011, 0.01), hair, s * 0.057, 0.068, zf - 0.006);
    brow.rotation.z = -s * 0.1;
  });
  add(head, new THREE.SphereGeometry(0.018, 10, 8), skin, 0, -0.018, R * 1.0);
  const smile = add(head, new THREE.TorusGeometry(0.04, 0.0065, 8, 20, Math.PI * 0.8), mat(0x7a3b33, 0.6), 0, -0.045, zf - 0.008);
  smile.rotation.z = Math.PI + Math.PI * 0.1;
  if (p.staffGlasses) {
    const frame = mat(0x151515, 0.35);
    [-1, 1].forEach((s) => {
      add(head, new THREE.TorusGeometry(coat ? 0.04 : 0.036, coat ? 0.0075 : 0.0055, 10, 28), frame, s * 0.058, 0.02, zf + 0.018);
      // temple: from the outer edge of the lens back into the hair
      add(head, new THREE.BoxGeometry(0.006, 0.006, 0.07), frame, s * (coat ? 0.1 : 0.094), 0.022, zf - 0.01);
    });
    add(head, new THREE.BoxGeometry(0.04, 0.005, 0.005), frame, 0, 0.026, zf + 0.02);
  }

  // lanyard and name tag
  const strap = mat(0x2f5fa8, 0.7);
  if (!coat) [-1, 1].forEach((s) => {
    const st = add(g, new THREE.BoxGeometry(0.014, 0.24, 0.004), strap, s * 0.05, 1.24, 0.118);
    st.rotation.z = -s * 0.32;
  });
  const name = (p.staffName || '').trim() || tr('Staff');
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 200;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, 320, 200);
  x.fillStyle = '#2f5fa8';
  x.fillRect(0, 0, 320, 46);
  x.fillStyle = '#ffffff';
  x.font = 'bold 30px Arial, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('HOMEDANT', 160, 24);
  x.fillStyle = '#111111';
  x.font = `bold ${name.length > 6 ? 46 : 64}px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif`;
  x.fillText(name, 160, 124, 296);
  // speech bubble above the head
  const say = p.staffSay === undefined ? 'Hi, how are you?' : p.staffSay.trim();
  if (say) {
    const b = makeSpeechBubble(say, 0.9);
    b.position.set(0, 1.98, 0);
    g.add(b);
  }
  const tagTex = new THREE.CanvasTexture(c);
  tagTex.anisotropy = 4;
  const tag = coat
    ? add(g, new THREE.BoxGeometry(0.11, 0.07, 0.004), mat(0xffffff), -0.135, 1.2, 0.128)
    : add(g, new THREE.BoxGeometry(0.11, 0.07, 0.004), mat(0xffffff), 0, 1.1, 0.123);
  if (coat) tag.rotation.y = -0.45;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.108, 0.068), new THREE.MeshBasicMaterial({ map: tagTex }));
  front.position.set(0, 0, 0.0025);
  tag.add(front);
}

function buildTVStand(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.4,
    roughness: 0.6,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.3,
  });
  // base
  const baseGeo = new THREE.BoxGeometry(w * 0.6, 0.04, d);
  const base = new THREE.Mesh(baseGeo, standMat);
  base.position.set(0, 0.02, 0);
  group.add(base);
  // pole
  const poleGeo = new THREE.BoxGeometry(0.06, h * 0.4, 0.06);
  const pole = new THREE.Mesh(poleGeo, standMat);
  pole.position.set(0, h * 0.2 + 0.04, 0);
  group.add(pole);
  // screen
  const screenGeo = new THREE.BoxGeometry(w, h * 0.55, 0.05);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, h * 0.7, 0);
  group.add(screen);
}

function buildProductMesh(p, tpl) {
  const group = new THREE.Group();
  // HOMEDANT HOUSE: draw the real outside width and depth (see hhOuterSize)
  if (isLevelProduct(tpl)) {
    const o = hhOuterSize(p);
    p = { ...p, width: o.width, depth: o.depth, caster2in: hhSmallCaster(p) };
  }
  switch (tpl.type) {
    case 'shelf':
      buildShelf(group, p, tpl);
      break;
    case 'open_base':
      buildShelf(group, p, tpl);
      break;
    case 'heavy':
      buildHeavy(group, p, tpl);
      break;
    case 'frame_open':
      buildFrameOpen(group, p, tpl);
      break;
    case 'garment':
      buildGarmentRack(group, p, tpl);
      break;
    case 'rolling':
      buildRolling(group, p, tpl);
      break;
    case 'pegboard':
      buildPegboard(group, p, tpl);
      break;
    case 'trolley':
      buildHHTrolley(group, p, tpl);
      break;
    case 'drawer':
      buildDrawer(group, p, tpl);
      break;
    case 'cabinet':
      buildCabinet(group, p, tpl);
      break;
    case 'banner':
      buildBanner(group, p);
      break;
    case 'poster':
      buildPoster(group, p);
      break;
    case 'logo_table':
      buildLogoTable(group, p);
      break;
    case 'table':
      buildTable(group, p);
      break;
    case 'chair':
      buildChair(group, p);
      break;
    case 'catalog':
      buildCatalogStand(group, p);
      break;
    case 'tv':
      buildTVStand(group, p);
      break;
    case 'staff':
      buildStaff(group, p, tpl);
      break;
    default:
      buildShelf(group, p, tpl);
  }
  return group;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
/* ============================================================
   SHARED LIBRARY (Supabase)
   Booth layouts and buyer proposals live in a shared database so the
   whole team sees the same folders from any computer. The tables are
   closed to the public key; every call goes through a database
   function that first checks the team code.
   ============================================================ */
const CLOUD_URL = 'https://uqtmalzkgzkyjmkkrqqz.supabase.co';
const CLOUD_KEY = 'sb_publishable_eFPznN5HbJ3EUxKraeeoIw_Rq3NarF_';
const TEAM_CODE_KEY = 'hbs-team-code';
function loadTeamCode() {
  try {
    return window.localStorage.getItem(TEAM_CODE_KEY) || '';
  } catch (e) {
    return '';
  }
}
function storeTeamCode(code) {
  try {
    if (code) window.localStorage.setItem(TEAM_CODE_KEY, code);
    else window.localStorage.removeItem(TEAM_CODE_KEY);
  } catch (e) {
    /* storage unavailable: the code lasts for this visit */
  }
}
async function cloud(fn, args) {
  const r = await fetch(`${CLOUD_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CLOUD_KEY },
    body: JSON.stringify(args),
  });
  const text = await r.text();
  if (!r.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text).message || text;
    } catch (e) {
      /* not JSON */
    }
    const err = new Error(msg);
    err.badCode = /invalid team code/.test(msg);
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

/* Folders and saved items for one kind ('booth' or 'buyer').
   getCurrent() returns { name, data, thumbnail } for "save";
   onOpen(item) receives a saved item with its data.               */
/* The shared list of folders and saved items for one app ('buyer' or
   'booth'), with the team code. Used by the buyer sidebar.            */
function useCloudList(kind, enabled) {
  const [code, setCode] = useState(loadTeamCode);
  const [authed, setAuthed] = useState(false);
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fail = (e) => {
    if (e.badCode) {
      storeTeamCode('');
      setCode('');
      setAuthed(false);
      setError(tr('The team code is not correct.'));
    } else setError(tr('Could not reach the shared library.') + ' ' + e.message);
  };
  const refresh = async (c = code) => {
    if (!c) return;
    setBusy(true);
    setError('');
    try {
      const r = await cloud('booth_list', { p_code: c, p_kind: kind });
      setFolders(r.folders || []);
      setItems(r.items || []);
      setAuthed(true);
      if (c !== code) setCode(c);
    } catch (e) {
      fail(e);
    }
    setBusy(false);
  };
  useEffect(() => {
    if (enabled && code) refresh(code);
  }, []);
  const login = async (raw) => {
    const c = (raw || '').trim();
    if (!c) return;
    setBusy(true);
    setError('');
    try {
      const ok = await cloud('booth_check', { p_code: c });
      if (!ok) {
        setError(tr('The team code is not correct.'));
        setBusy(false);
        return;
      }
      storeTeamCode(c);
      setCode(c);
      await refresh(c);
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  };
  const run = async (fn, args) => {
    setBusy(true);
    setError('');
    try {
      const r = await cloud(fn, { p_code: code, ...args });
      await refresh();
      return r;
    } catch (e) {
      fail(e);
      setBusy(false);
      return null;
    }
  };
  const get = async (id) => {
    try {
      return await cloud('booth_get_item', { p_code: code, p_id: id });
    } catch (e) {
      fail(e);
      return null;
    }
  };
  return { kind, code, authed, folders, items, busy, error, refresh, login, run, get };
}

/* Buyer app, left side: buyers (folders) with their proposals on top,
   the products underneath. A product clicked here starts a new
   proposal for the buyer that is open.                                */
function BuyerSidebar({ lib, folderId, setFolderId, cloudId, onOpenItem, onNewProposal, onPickProduct, productId, onManage }) {
  const [open, setOpen] = useState({}); // expanded folders
  const [editing, setEditing] = useState(null); // { type: 'newFolder' | 'folder' | 'item', id }
  const [ask, setAsk] = useState(null); // { text, onYes }
  const [codeInput, setCodeInput] = useState('');
  const { folders, items } = lib;
  const childrenOf = (pid) => folders.filter((f) => (f.parent_id || null) === pid);
  const itemsIn = (fid) => items.filter((it) => (it.folder_id || null) === fid);
  const countIn = (fid) => itemsIn(fid).length + childrenOf(fid).reduce((n, f) => n + countIn(f.id), 0);
  const isOpen = (fid) => open[fid] !== undefined ? open[fid] : fid === folderId;
  // keep the folder of the open proposal expanded
  useEffect(() => {
    if (folderId) setOpen((o) => ({ ...o, [folderId]: true }));
  }, [folderId]);

  const iconBtn = 'p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100';
  const itemRow = (it) =>
    editing && editing.type === 'item' && editing.id === it.id ? (
      <div key={it.id} className="py-0.5">
        <InlineName
          initial={it.name}
          onCommit={async (n) => {
            setEditing(null);
            await lib.run('booth_save_item', { p_item: { id: it.id, name: n } });
          }}
          onCancel={() => setEditing(null)}
          className="w-full"
        />
      </div>
    ) : (
      <div
        key={it.id}
        onClick={() => onOpenItem(it)}
        className={
          'group flex items-center gap-2 px-1.5 py-1 mb-0.5 rounded-md cursor-pointer ' +
          (it.id === cloudId ? 'bg-gray-900 text-white' : 'hover:bg-white')
        }
      >
        <span className="flex-none w-9 h-7 rounded overflow-hidden bg-gray-200">
          {it.thumbnail && <img src={it.thumbnail} alt="" className="w-full h-full object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs truncate">{it.name}</span>
          <span className={'block text-[10px] ' + (it.id === cloudId ? 'text-gray-300' : 'text-gray-400')}>
            {new Date(it.updated_at).toLocaleDateString()}
          </span>
        </span>
        <span className="hidden group-hover:flex items-center">
          <button
            title={tr('Rename')}
            className={iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              setEditing({ type: 'item', id: it.id });
            }}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            title={tr('Delete')}
            className={iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              setAsk({
                text: `“${it.name}” ` + tr('will be deleted for everyone on the team.'),
                onYes: async () => {
                  await lib.run('booth_delete_item', { p_id: it.id });
                  if (it.id === cloudId) onNewProposal(folderId);
                },
              });
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </span>
      </div>
    );

  const folderBlock = (f, depth) => {
    const expanded = isOpen(f.id);
    const active = f.id === folderId;
    return (
      <div key={f.id}>
        {editing && editing.type === 'folder' && editing.id === f.id ? (
          <div className="py-0.5" style={{ paddingLeft: depth * 12 }}>
            <InlineName
              initial={f.name}
              onCommit={async (n) => {
                setEditing(null);
                await lib.run('booth_save_folder', { p_folder: { id: f.id, name: n } });
              }}
              onCancel={() => setEditing(null)}
              className="w-full"
            />
          </div>
        ) : (
          <div
            onClick={() => {
              setOpen((o) => ({ ...o, [f.id]: !expanded }));
              setFolderId(f.id);
            }}
            className={'group flex items-center gap-1.5 px-1.5 py-1.5 rounded-md cursor-pointer text-xs ' + (active ? 'bg-white font-medium' : 'hover:bg-white text-gray-700')}
            style={{ paddingLeft: 6 + depth * 12 }}
          >
            {expanded ? <ChevronDown className="w-3 h-3 text-gray-400 flex-none" /> : <ChevronRight className="w-3 h-3 text-gray-400 flex-none" />}
            <FolderOpen className="w-3.5 h-3.5 flex-none text-gray-500" />
            <span className="flex-1 truncate">{f.name}</span>
            <span className="group-hover:hidden text-[11px] text-gray-400">{countIn(f.id)}</span>
            <span className="hidden group-hover:flex items-center">
              <button
                title={tr('Rename')}
                className={iconBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing({ type: 'folder', id: f.id });
                }}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                title={tr('Delete')}
                className={iconBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setAsk({
                    text: `“${f.name}” ` + tr('Delete this folder? What is inside moves up one level.'),
                    onYes: async () => {
                      await lib.run('booth_delete_folder', { p_id: f.id });
                      if (active) setFolderId(f.parent_id || null);
                    },
                  });
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
        {expanded && (
          <div className="ml-3 pl-2 border-l mb-1" style={{ borderColor: UI_LINE, marginLeft: 12 + depth * 12 }}>
            {childrenOf(f.id).map((c) => folderBlock(c, 0))}
            {itemsIn(f.id).map(itemRow)}
            <button
              onClick={() => onNewProposal(f.id)}
              className="w-full text-left text-[11px] text-gray-600 px-2 py-1 mt-0.5 rounded-md border border-dashed border-gray-300 hover:bg-white"
            >
              + {tr('New proposal for this buyer')}
            </button>
          </div>
        )}
      </div>
    );
  };

  const loose = itemsIn(null);
  const folderName = folderId ? (folders.find((f) => f.id === folderId) || {}).name : null;
  return (
    <div className="p-3 relative">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[11px] font-semibold tracking-wide text-gray-500">{tr('Buyers')}</span>
        <span className="flex items-center gap-1">
          {lib.busy && <span className="text-[10px] text-gray-400">{tr('Working…')}</span>}
          {lib.authed && (
            <button title={tr('Manage folders')} onClick={onManage} className={iconBtn}>
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
      </div>

      {!lib.authed ? (
        <div className="rounded-lg border bg-white p-3 mb-3" style={{ borderColor: UI_LINE }}>
          <div className="text-xs text-gray-700 mb-2">{tr('Enter the team code')}</div>
          <div className="flex gap-1.5">
            <input
              type="password"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lib.login(codeInput)}
              className="flex-1 min-w-0 text-xs border border-gray-300 rounded px-2 py-1"
            />
            <button onClick={() => lib.login(codeInput)} className="text-xs px-2.5 py-1 rounded bg-gray-900 text-white">
              {tr('Open')}
            </button>
          </div>
          {lib.error && <div className="text-[11px] text-red-600 mt-1.5">{lib.error}</div>}
        </div>
      ) : (
        <div className="mb-3">
          {lib.error && <div className="text-[11px] text-red-600 mb-1.5">{lib.error}</div>}
          {childrenOf(null).map((f) => folderBlock(f, 0))}
          {loose.length > 0 && (
            <div>
              <div
                onClick={() => setOpen((o) => ({ ...o, __none: !o.__none }))}
                className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-md cursor-pointer text-xs text-gray-500 hover:bg-white"
              >
                {open.__none ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                <span className="flex-1">{tr('No folder')}</span>
                <span className="text-[11px] text-gray-400">{loose.length}</span>
              </div>
              {open.__none && <div className="ml-3 pl-2 border-l mb-1" style={{ borderColor: UI_LINE }}>{loose.map(itemRow)}</div>}
            </div>
          )}
          {editing && editing.type === 'newFolder' ? (
            <div className="flex items-center gap-1.5 px-1.5 py-1">
              <FolderOpen className="w-3.5 h-3.5 text-gray-500 flex-none" />
              <InlineName
                placeholder={tr('Buyer name')}
                onCommit={async (n) => {
                  setEditing(null);
                  const r = await lib.run('booth_save_folder', { p_folder: { kind: lib.kind, name: n, parent_id: null } });
                  if (r) onNewProposal(r.id);
                }}
                onCancel={() => setEditing(null)}
                className="flex-1"
              />
            </div>
          ) : (
            <button
              onClick={() => setEditing({ type: 'newFolder' })}
              className="w-full mt-1.5 text-xs text-gray-600 py-1.5 rounded-md border border-dashed border-gray-300 hover:bg-white"
            >
              + {tr('New buyer folder')}
            </button>
          )}
        </div>
      )}

      <div className="flex items-baseline justify-between mb-1.5 mt-4 px-0.5">
        <span className="text-[11px] font-semibold tracking-wide text-gray-500">{tr('Products')}</span>
        {folderName && cloudId && <span className="text-[10px] text-gray-400 truncate ml-2">{tr('Click to start a new proposal')}</span>}
      </div>
      {BUYER_TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onPickProduct(t)}
          className={
            'w-full flex items-center gap-2.5 text-left px-2.5 py-1.5 mb-1 rounded-lg border transition ' +
            (t.id === productId ? 'bg-white border-gray-900' : 'bg-white border-gray-200 hover:border-gray-400')
          }
        >
          <ProductThumb type={t.type} tpl={t} />
          <span className="min-w-0">
            <span className="block text-xs font-medium text-gray-900 truncate">{tr(t.name)}</span>
            <span className="block text-[11px] text-gray-500">
              {t.defaultSize.width}×{t.defaultSize.depth}×{t.defaultSize.height}mm
            </span>
          </span>
        </button>
      ))}

      {ask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} onClick={() => setAsk(null)}>
          <div className="bg-white rounded-lg shadow-xl border p-4 w-80" style={{ borderColor: UI_LINE }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm text-gray-800 mb-4 leading-relaxed">{ask.text}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAsk(null)} className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:border-gray-400">
                {tr('Cancel')}
              </button>
              <button
                autoFocus
                onClick={() => {
                  const a = ask;
                  setAsk(null);
                  a.onYes();
                }}
                className="text-xs font-medium px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {tr('Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* One-line name editor used inside the library instead of the browser's
   prompt box. Enter saves, Esc cancels, clicking away saves. */
function InlineName({ initial = '', placeholder, onCommit, onCancel, className = '' }) {
  const [v, setV] = useState(initial);
  const done = useRef(false);
  const commit = () => {
    if (done.current) return;
    done.current = true;
    const t = v.trim();
    if (t && t !== initial) onCommit(t);
    else onCancel();
  };
  return (
    <input
      autoFocus
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          done.current = true;
          onCancel();
        }
      }}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      className={'min-w-0 text-xs border border-gray-900 rounded px-2 py-1 bg-white outline-none ' + className}
    />
  );
}

function CloudLibrary({ kind, title, getCurrent, onOpen, currentId, setCurrentId, onClose, localImport }) {
  const [code, setCode] = useState(loadTeamCode);
  const [codeInput, setCodeInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState('all'); // 'all', 'none' or a folder id
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cur = getCurrent();
  const [saveName, setSaveName] = useState(cur.name);
  // inline editing: { type: 'newFolder' | 'folder' | 'item', id }
  const [editing, setEditing] = useState(null);
  // in-app confirm box: { text, yes, onYes }
  const [ask, setAsk] = useState(null);
  const [notice, setNotice] = useState('');

  const fail = (e) => {
    if (e.badCode) {
      storeTeamCode('');
      setCode('');
      setAuthed(false);
      setError(tr('The team code is not correct.'));
    } else setError(tr('Could not reach the shared library.') + ' ' + e.message);
  };
  const refresh = async (c = code) => {
    setBusy(true);
    setError('');
    try {
      const r = await cloud('booth_list', { p_code: c, p_kind: kind });
      setFolders(r.folders || []);
      setItems(r.items || []);
      setAuthed(true);
    } catch (e) {
      fail(e);
    }
    setBusy(false);
  };
  useEffect(() => {
    if (code) refresh(code);
  }, []);

  const submitCode = async () => {
    const c = codeInput.trim();
    if (!c) return;
    setBusy(true);
    setError('');
    try {
      const ok = await cloud('booth_check', { p_code: c });
      if (!ok) {
        setError(tr('The team code is not correct.'));
        setBusy(false);
        return;
      }
      storeTeamCode(c);
      setCode(c);
      await refresh(c);
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  };

  const run = async (fn, args) => {
    setBusy(true);
    setError('');
    try {
      const r = await cloud(fn, { p_code: code, ...args });
      await refresh();
      return r;
    } catch (e) {
      fail(e);
      setBusy(false);
      return null;
    }
  };
  const folderId = sel === 'all' || sel === 'none' ? null : sel;
  const saveNew = async () => {
    const name = saveName.trim() || cur.name;
    const r = await run('booth_save_item', {
      p_item: { kind, name, folder_id: folderId, data: cur.data, thumbnail: cur.thumbnail },
    });
    if (r) setCurrentId(r.id);
  };
  const overwrite = async () => {
    await run('booth_save_item', { p_item: { id: currentId, data: cur.data, thumbnail: cur.thumbnail } });
  };
  const open = async (it) => {
    setBusy(true);
    try {
      const full = await cloud('booth_get_item', { p_code: code, p_id: it.id });
      if (full) {
        onOpen(full);
        setCurrentId(full.id);
        onClose();
      }
    } catch (e) {
      fail(e);
    }
    setBusy(false);
  };
  const newFolder = () => setEditing({ type: 'newFolder' });
  const createFolder = async (name) => {
    setEditing(null);
    const r = await run('booth_save_folder', { p_folder: { kind, name, parent_id: folderId } });
    if (r) setSel(r.id);
  };
  const renameFolder = (f) => setEditing({ type: 'folder', id: f.id });
  const saveFolderName = async (f, name) => {
    setEditing(null);
    await run('booth_save_folder', { p_folder: { id: f.id, name } });
  };
  const deleteFolder = (f) =>
    setAsk({
      text: `“${f.name}” ` + tr('Delete this folder? What is inside moves up one level.'),
      yes: tr('Delete'),
      onYes: async () => {
        await run('booth_delete_folder', { p_id: f.id });
        setSel('all');
      },
    });
  const renameItem = (it) => setEditing({ type: 'item', id: it.id });
  const saveItemName = async (it, name) => {
    setEditing(null);
    await run('booth_save_item', { p_item: { id: it.id, name } });
  };
  const moveItem = async (it, fid) => {
    await run('booth_save_item', { p_item: { id: it.id, folder_id: fid || '' } });
  };
  const deleteItem = (it) =>
    setAsk({
      text: `“${it.name}” ` + tr('will be deleted for everyone on the team.'),
      yes: tr('Delete'),
      onYes: async () => {
        await run('booth_delete_item', { p_id: it.id });
        if (it.id === currentId) setCurrentId(null);
      },
    });
  const importLocal = async () => {
    if (!localImport) return;
    setBusy(true);
    try {
      let n = 0;
      for (const d of localImport.list) {
        await cloud('booth_save_item', { p_code: code, p_item: { kind, name: d.name, folder_id: folderId, data: d.data } });
        n++;
      }
      localImport.done();
      await refresh();
      setNotice(`${n} ${tr('designs uploaded.')}`);
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  };

  // folder tree, nested by parent
  const childrenOf = (pid) => folders.filter((f) => (f.parent_id || null) === pid);
  const flat = [];
  const walk = (pid, depth) =>
    childrenOf(pid).forEach((f) => {
      flat.push({ f, depth });
      walk(f.id, depth + 1);
    });
  walk(null, 0);
  const shown = items.filter((it) =>
    sel === 'all' ? true : sel === 'none' ? !it.folder_id : it.folder_id === sel
  );
  const rowCls = (on) =>
    'w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-1.5 ' +
    (on ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-white');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} onClick={onClose}>
      <div
        className="relative bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(960px, 94vw)', height: 'min(640px, 90vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {ask && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
            <div className="bg-white rounded-lg shadow-xl border p-4 w-80" style={{ borderColor: UI_LINE }}>
              <div className="text-sm text-gray-800 mb-4 leading-relaxed">{ask.text}</div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setAsk(null)} className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:border-gray-400">
                  {tr('Cancel')}
                </button>
                <button
                  autoFocus
                  onClick={() => {
                    const a = ask;
                    setAsk(null);
                    a.onYes();
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  {ask.yes}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-none flex items-center gap-2 px-4 h-12 border-b" style={{ borderColor: UI_LINE }}>
          <FolderOpen className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-gray-400">{tr('Shared with the team')}</span>
          <span className="flex-1" />
          {busy && <span className="text-xs text-gray-400">{tr('Working…')}</span>}
          <button onClick={onClose} className="p-1.5 rounded text-gray-500 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!authed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
            <div className="text-sm font-medium">{tr('Enter the team code')}</div>
            <div className="text-xs text-gray-500 text-center max-w-sm">
              {tr('Saved layouts and proposals are shared by everyone on the team. This computer will remember the code.')}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitCode()}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 w-56"
                autoFocus
              />
              <button onClick={submitCode} className="text-xs font-medium px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-700">
                {tr('Open')}
              </button>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
        ) : (
          <>
            {/* save the current work */}
            <div className="flex-none flex items-center gap-2 px-4 py-2.5 border-b" style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}>
              <span className="text-xs text-gray-500 whitespace-nowrap">{tr('Save current work')}</span>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="flex-1 min-w-0 text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">
                → {folderId ? (folders.find((f) => f.id === folderId) || {}).name : tr('No folder')}
              </span>
              <button onClick={saveNew} className="text-xs font-medium px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-700 whitespace-nowrap">
                {tr('Save as new')}
              </button>
              {currentId && items.some((it) => it.id === currentId) && (
                <button onClick={overwrite} className="text-xs px-3 py-1.5 rounded border border-gray-300 bg-white hover:border-gray-400 whitespace-nowrap">
                  {tr('Overwrite')} “{(items.find((it) => it.id === currentId) || {}).name}”
                </button>
              )}
            </div>

            <div className="flex-1 flex min-h-0">
              {/* folders */}
              <div className="flex-none w-60 border-r overflow-y-auto p-2" style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}>
                <button onClick={() => setSel('all')} className={rowCls(sel === 'all')}>
                  {tr('All')} <span className="opacity-60">{items.length}</span>
                </button>
                <button onClick={() => setSel('none')} className={rowCls(sel === 'none')}>
                  {tr('No folder')} <span className="opacity-60">{items.filter((it) => !it.folder_id).length}</span>
                </button>
                <div className="my-2 border-t" style={{ borderColor: UI_LINE }} />
                {(() => {
                  const newRow = (depth) => (
                    <div key="new" className="flex items-center gap-1.5 py-0.5" style={{ paddingLeft: depth * 14 + 8 }}>
                      <FolderOpen className="w-3.5 h-3.5 flex-none text-gray-500" />
                      <InlineName
                        placeholder={tr('Folder name')}
                        onCommit={createFolder}
                        onCancel={() => setEditing(null)}
                        className="flex-1"
                      />
                    </div>
                  );
                  const rows = [];
                  const addingNew = editing && editing.type === 'newFolder';
                  if (addingNew && !folderId) rows.push(newRow(0));
                  flat.forEach(({ f, depth }) => {
                    rows.push(
                      <div key={f.id} className="group flex items-center" style={{ paddingLeft: depth * 14 }}>
                        {editing && editing.type === 'folder' && editing.id === f.id ? (
                          <div className="flex-1 flex items-center gap-1.5 px-2 py-0.5">
                            <FolderOpen className="w-3.5 h-3.5 flex-none text-gray-500" />
                            <InlineName
                              initial={f.name}
                              onCommit={(n) => saveFolderName(f, n)}
                              onCancel={() => setEditing(null)}
                              className="flex-1"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setSel(f.id)}
                            onDoubleClick={() => renameFolder(f)}
                            className={rowCls(sel === f.id) + ' flex-1 min-w-0'}
                          >
                            <FolderOpen className="w-3.5 h-3.5 flex-none" />
                            <span className="truncate">{f.name}</span>
                            <span className="opacity-60">{items.filter((it) => it.folder_id === f.id).length}</span>
                          </button>
                        )}
                      </div>
                    );
                    if (addingNew && folderId === f.id) rows.push(newRow(depth + 1));
                  });
                  return rows;
                })()}
                <button onClick={newFolder} className="w-full mt-2 text-xs px-2 py-1.5 rounded border border-dashed border-gray-300 text-gray-600 hover:bg-white">
                  + {folderId ? tr('New folder inside') : tr('New folder')}
                </button>
                {folderId && (
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => renameFolder(folders.find((f) => f.id === folderId))} className="flex-1 text-xs px-2 py-1 rounded text-gray-600 hover:bg-white">
                      {tr('Rename')}
                    </button>
                    <button onClick={() => deleteFolder(folders.find((f) => f.id === folderId))} className="flex-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50">
                      {tr('Delete')}
                    </button>
                  </div>
                )}
                {localImport && localImport.list.length > 0 && (
                  <button onClick={importLocal} className="w-full mt-4 text-[11px] px-2 py-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-left">
                    {tr('Upload designs saved on this computer')} ({localImport.list.length})
                  </button>
                )}
              </div>

              {/* items */}
              <div className="flex-1 overflow-y-auto p-3">
                {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
                {notice && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1.5 mb-2 flex items-center">
                    <span className="flex-1">{notice}</span>
                    <button onClick={() => setNotice('')} className="p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {shown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">{tr('Nothing saved here yet.')}</div>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                    {shown.map((it) => (
                      <div key={it.id} className={'rounded-lg border bg-white overflow-hidden ' + (it.id === currentId ? 'border-gray-900' : 'border-gray-200')}>
                        <button onClick={() => open(it)} className="block w-full aspect-[16/10] bg-gray-100" title={tr('Open')}>
                          {it.thumbnail ? (
                            <img src={it.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-6 h-6 mx-auto text-gray-300" />
                          )}
                        </button>
                        <div className="p-2">
                          {editing && editing.type === 'item' && editing.id === it.id ? (
                            <InlineName
                              initial={it.name}
                              onCommit={(n) => saveItemName(it, n)}
                              onCancel={() => setEditing(null)}
                              className="w-full"
                            />
                          ) : (
                            <div className="text-xs font-medium text-gray-900 truncate" onDoubleClick={() => renameItem(it)}>
                              {it.name}
                            </div>
                          )}
                          <div className="text-[11px] text-gray-400">{new Date(it.updated_at).toLocaleString()}</div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <button onClick={() => open(it)} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-900 text-white">
                              {tr('Open')}
                            </button>
                            <button onClick={() => renameItem(it)} className="text-[11px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-700">
                              {tr('Rename')}
                            </button>
                            <select
                              value={it.folder_id || ''}
                              onChange={(e) => moveItem(it, e.target.value)}
                              title={tr('Move to folder')}
                              className="flex-1 min-w-0 text-[11px] border border-gray-300 rounded px-1 py-0.5 bg-white"
                            >
                              <option value="">{tr('No folder')}</option>
                              {flat.map(({ f, depth }) => (
                                <option key={f.id} value={f.id}>
                                  {'\u00a0'.repeat(depth * 2)}
                                  {f.name}
                                </option>
                              ))}
                            </select>
                            <button onClick={() => deleteItem(it)} className="p-0.5 rounded text-gray-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Start screen: pick the booth planner or the buyer configurator. */
function StartScreen() {
  const [lang, setLangState] = useState(loadLang);
  _lang = lang;
  const setLang = (l) => {
    setLangState(l);
    try {
      window.localStorage.setItem('hbs-lang', l);
    } catch (e) {
      /* storage unavailable */
    }
  };
  const cards = [
    {
      mode: 'booth',
      icon: <Layers className="w-6 h-6" />,
      title: 'Trade show booth planner',
      body: 'Lay out a booth for an overseas trade show: products, display items, staff and visitors.',
      who: 'For our team',
    },
    {
      mode: 'buyer',
      icon: <Box className="w-6 h-6" />,
      title: 'Buyer proposal configurator',
      body: 'Set a shelf size and colors, compare colors side by side, and export a proposal image for a buyer.',
      who: 'For our team: buyer proposals',
    },
  ];
  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center text-gray-900"
      style={{ backgroundColor: UI_PANEL, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}
    >
      <div className="absolute top-4 right-4 flex gap-1">
        {[
          ['en', 'EN'],
          ['ko', '한국어'],
        ].map(([code, name]) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={'text-xs px-2 py-1 rounded ' + (lang === code ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-white')}
          >
            {name}
          </button>
        ))}
      </div>
      <img src={HOMEDANT_WORDMARK_URL} alt="HOMEDANT" className="h-7 mb-3" />
      <div className="text-sm text-gray-500 mb-10">{tr('Shelf simulator')}</div>
      <div className="flex gap-5">
        {cards.map((c) => (
          <button
            key={c.mode}
            onClick={() => openApp(c.mode)}
            className="w-80 text-left bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-900 hover:shadow-md transition"
          >
            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800 mb-4">{c.icon}</div>
            <div className="text-base font-semibold mb-1.5">{tr(c.title)}</div>
            <div className="text-sm text-gray-600 leading-relaxed mb-4">{tr(c.body)}</div>
            <div className="text-xs text-gray-400">{tr(c.who)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SimulatorApp() {
  if (!APP_MODE) return <StartScreen />;
  return <BoothSimulator />;
}

function BoothSimulator() {
  // ----- state -----
  const [booth, setBooth] = useState(BUYER_MODE ? {
    width: 30000,
    depth: 30000,
    wallHeight: 2438,
    unit: 'mm',
    style: 'studio',
    look: 'studio',
  } : {
    width: 3048, // 10ft in mm  (10ft x 10ft default)
    depth: 3048, // 10ft in mm
    wallHeight: 2438, // 8ft in mm
    unit: 'ft',
    style: 'wall', // 'wall' = solid panel booth, 'curtain' = curtain booth
    look: DEFAULT_LOOK, // see BOOTH_LOOKS
  });
  const [lang, setLangState] = useState(loadLang);
  _lang = lang; // read by tr() everywhere below
  const setLang = (l) => {
    setLangState(l);
    try {
      window.localStorage.setItem('hbs-lang', l);
    } catch (e) {
      /* storage unavailable: the choice just lasts for this visit */
    }
  };
  const [showPeople, setShowPeople] = useState(false);
  // real prop models load in the background; shelves with display items
  // are redrawn once they are ready
  const [propsReady, setPropsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadPropModels().then((ok) => {
      if (ok && alive) setPropsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeBrand, setActiveBrand] = useState(LIBRARY_BRANDS[0]);
  const [viewMode, setViewMode] = useState('3d');
  const [warnings, setWarnings] = useState({}); // instanceId -> reason
  // current layout name (used in exported PNG filenames)
  const [layoutName, setLayoutName] = useState('layout1');
  const [openMenu, setOpenMenu] = useState(null); // header menus and booth settings
  // buyer configurator: one product, optionally shown in several colours
  const [buyerBase, setBuyerBase] = useState(() => (BUYER_MODE ? newBuyerProduct(BUYER_TEMPLATES[0]) : null));
  const [buyerCompare, setBuyerCompare] = useState([]);
  // shared library: which saved item the current work came from
  const [cloudId, setCloudId] = useState(null);
  const [showCloud, setShowCloud] = useState(false);
  // buyer app: the shared list and the buyer (folder) being worked on
  const buyerLib = useCloudList('buyer', BUYER_MODE);
  const [buyerFolder, setBuyerFolder] = useState(null);
  // saved designs library (persisted in localStorage)
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  // id of the design currently being worked on (null = never saved yet).
  // Lets Ctrl+S overwrite the same library entry instead of always adding.
  const [currentDesignId, setCurrentDesignId] = useState(null);
  // brief "Saved ✓" confirmation shown after a save
  const [saveStatus, setSaveStatus] = useState('');

  // ----- refs (Three.js handles) -----
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const tickRef = useRef(null); // per-frame callback (visitors)
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const boothGroupRef = useRef(null);
  const productsGroupRef = useRef(null);
  const meshMapRef = useRef(new Map()); // instanceId -> THREE.Group
  const dragRef = useRef(null);
  const levelDragRef = useRef(null); // dragging one shelf level in 3D
  const [levelTip, setLevelTip] = useState(null); // height label by the cursor
  const animationIdRef = useRef(null);
  const productsRef = useRef(products);
  const selectedRef = useRef(selectedId);
  // always-current ref to saveDesign, so the Ctrl+S listener (bound once)
  // calls the latest version with up-to-date state
  const saveDesignRef = useRef(null);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  /* ---------- Three.js init ---------- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200
    );
    camera.position.set(8, 6, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // lights
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(8, 14, 6);
    dir.castShadow = true;
    dir.name = 'keyLight';
    /* Shadow quality. The old setup spread a 1024px shadow map over a
       30 m square (about 29 mm per pixel) with no bias, so every lit
       surface shadowed itself in a diagonal grid ("shadow acne") - most
       visible on the wood boards. The map is now 4096px and the shadow
       area is fitted to the booth (see fitShadowToBooth), with a small
       bias to stop surfaces shadowing themselves.                      */
    dir.shadow.mapSize.set(4096, 4096);
    dir.shadow.bias = -0.0003;
    dir.shadow.normalBias = 0.006;
    dir.shadow.radius = 2;
    fitShadowToBooth(dir, 6.1, 6.1, 3);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-6, 8, -6);
    scene.add(fill);

    // groups
    const boothGroup = new THREE.Group();
    scene.add(boothGroup);
    boothGroupRef.current = boothGroup;

    const productsGroup = new THREE.Group();
    scene.add(productsGroup);
    productsGroupRef.current = productsGroup;

    // ---- simple orbit controls ----
    const controls = createOrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    // resize
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth,
        h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // animation loop
    let lastT = performance.now();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (tickRef.current) tickRef.current(dt);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  /* ---------- rebuild booth on change ---------- */
  useEffect(() => {
    const group = boothGroupRef.current;
    if (!group) return;
    while (group.children.length) {
      const c = group.children[0];
      group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    }
    const look = BOOTH_LOOKS[booth.look] || BOOTH_LOOKS[DEFAULT_LOOK];
    if (sceneRef.current) sceneRef.current.background = new THREE.Color(look.background);
    const w = booth.width * MM_TO_M;
    const d = booth.depth * MM_TO_M;
    const wh = booth.wallHeight * MM_TO_M;

    // keep the shadow area matched to the current booth size
    const keyLight =
      sceneRef.current && sceneRef.current.getObjectByName('keyLight');
    // (the studio floor is huge, but its products stand in the middle)
    if (keyLight) fitShadowToBooth(keyLight, booth.style === 'studio' ? 7 : w, booth.style === 'studio' ? 5 : d, wh);
    // buyer view shows the product alone: no floor and no cast shadows,
    // the lights still shade its faces
    const studio = booth.style === 'studio';
    if (keyLight) keyLight.castShadow = !studio;

    // floor
    const floorGeo = new THREE.PlaneGeometry(w, d);
    const floorMat = look.carpet
      ? makeCarpetMaterial(look.floor, w, d)
      : new THREE.MeshStandardMaterial({
          color: look.floor,
          roughness: 0.95,
          metalness: 0,
        });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.isFloor = true;
    if (!studio) group.add(floor);

    if (look.grid) {
      const grid = new THREE.GridHelper(
        Math.max(w, d),
        Math.round(Math.max(w, d) * 2),
        0xcccccc,
        0xe5e5e5
      );
      grid.position.y = 0.001;
      group.add(grid);
    }
    if (look.aisle !== null) {
      // hall floor around the booth, in a different carpet colour
      const aw = w + 9,
        ad = d + 9;
      const aisle = new THREE.Mesh(
        new THREE.PlaneGeometry(aw, ad),
        makeCarpetMaterial(look.aisle, aw, ad)
      );
      aisle.rotation.x = -Math.PI / 2;
      aisle.position.y = -0.004;
      aisle.receiveShadow = true;
      group.add(aisle);
    }

    if (booth.style === 'studio') {
      // buyer configurator: products on a plain floor, no booth walls
    } else if (booth.style === 'curtain') {
      // ---- CURTAIN BOOTH (pipe & drape) ----
      // Matches a real inline curtain booth: a TALL back curtain (full
      // wall height) and SHORT side curtains (~3ft vs 8ft = ~0.375 of
      // the back height), each on its own pipe frame.
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x9aa0a6,
        roughness: 0.5,
        metalness: 0.6,
      });
      const poleR = 0.025;
      const railR = 0.018;
      const sideH = wh * 0.375; // 3ft side rail vs 8ft back wall

      // --- back frame: 2 tall poles + top rail ---
      [[-w / 2], [w / 2]].forEach(([cx]) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(poleR, poleR, wh, 12),
          poleMat
        );
        pole.position.set(cx, wh / 2, -d / 2);
        pole.castShadow = true;
        group.add(pole);
      });
      const backRail = new THREE.Mesh(
        new THREE.CylinderGeometry(railR, railR, w, 12),
        poleMat
      );
      backRail.rotation.z = Math.PI / 2;
      backRail.position.set(0, wh - railR, -d / 2);
      group.add(backRail);

      // --- side frames: 2 short front poles + 2 short side rails ---
      [[-w / 2], [w / 2]].forEach(([cx]) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(poleR, poleR, sideH, 12),
          poleMat
        );
        pole.position.set(cx, sideH / 2, d / 2); // front corner pole
        pole.castShadow = true;
        group.add(pole);
        // short side rail running front-to-back at the side height
        const sideRail = new THREE.Mesh(
          new THREE.CylinderGeometry(railR, railR, d, 12),
          poleMat
        );
        sideRail.rotation.x = Math.PI / 2;
        sideRail.position.set(cx, sideH - railR, 0);
        group.add(sideRail);
      });

      // --- curtain fabric material with pleated texture ---
      const makeCurtainMat = (panelW, panelH) => {
        const tex = makeCurtainTexture().clone();
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        // repeat horizontally so pleats stay a natural width (~0.5m each)
        tex.repeat.set(Math.max(2, Math.round(panelW / 0.5)), 1);
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return new THREE.MeshStandardMaterial({
          map: tex,
          color: 0xffffff,
          roughness: 0.95,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
      };
      // geometry helper — a plane with soft in/out folds across its width
      const makeCurtainGeo = (cw, ch, segs) => {
        const geo = new THREE.PlaneGeometry(cw, ch, segs, 1);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const xx = pos.getX(i);
          const fold = Math.sin((xx / cw) * Math.PI * segs) * 0.025;
          pos.setZ(i, fold);
        }
        geo.computeVertexNormals();
        return geo;
      };

      // back curtain — full height
      const backH = wh - railR * 2;
      const backCurtain = new THREE.Mesh(
        makeCurtainGeo(w, backH, 16),
        makeCurtainMat(w, backH)
      );
      backCurtain.position.set(0, backH / 2 + railR, -d / 2);
      backCurtain.receiveShadow = true;
      group.add(backCurtain);

      // side curtains — short (3ft) height
      const sideCurtainH = sideH - railR * 2;
      [[-w / 2], [w / 2]].forEach(([sx]) => {
        const sideCurtain = new THREE.Mesh(
          makeCurtainGeo(d, sideCurtainH, 12),
          makeCurtainMat(d, sideCurtainH)
        );
        sideCurtain.rotation.y = Math.PI / 2;
        sideCurtain.position.set(sx, sideCurtainH / 2 + railR, 0);
        sideCurtain.receiveShadow = true;
        group.add(sideCurtain);
      });

      // brand strip — ID-sign valance across the top of the back curtain
      const valGeo = new THREE.BoxGeometry(w * 0.55, 0.22, 0.03);
      const valMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
      });
      const valance = new THREE.Mesh(valGeo, valMat);
      valance.position.set(0, wh - 0.18, -d / 2 + 0.03);
      group.add(valance);
      // thin red accent line under the sign
      const accentGeo = new THREE.BoxGeometry(w * 0.55, 0.03, 0.035);
      const accentMat = new THREE.MeshStandardMaterial({
        color: 0xc62828,
        roughness: 0.7,
      });
      const accent = new THREE.Mesh(accentGeo, accentMat);
      accent.position.set(0, wh - 0.31, -d / 2 + 0.035);
      group.add(accent);
      if (look.sign) {
        const sign = makeLogoSign(Math.min(w * 0.4, 0.14 * HOMEDANT_WORDMARK_ASPECT));
        sign.position.set(0, wh - 0.18, -d / 2 + 0.047);
        group.add(sign);
      }
    } else {
      // ---- WALL BOOTH: solid panel walls (default) ----
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      const wallThk = 0.05;
      // back wall (along +X)
      const backGeo = new THREE.BoxGeometry(w, wh, wallThk);
      const back = new THREE.Mesh(backGeo, wallMat);
      back.position.set(0, wh / 2, -d / 2);
      back.receiveShadow = true;
      group.add(back);
      // left wall
      const sideGeo = new THREE.BoxGeometry(wallThk, wh, d);
      const left = new THREE.Mesh(sideGeo, wallMat);
      left.position.set(-w / 2, wh / 2, 0);
      left.receiveShadow = true;
      group.add(left);
      // right wall
      const right = new THREE.Mesh(sideGeo, wallMat);
      right.position.set(w / 2, wh / 2, 0);
      right.receiveShadow = true;
      group.add(right);

      if (look.sign) {
        // logo sign high on the back wall, like the lettering on a real booth
        const sign = makeLogoSign(Math.min(w * 0.42, 2.4));
        sign.position.set(0, wh - 0.38, -d / 2 + wallThk / 2 + 0.004);
        group.add(sign);
      } else {
        // brand strip (red accent on back wall top)
        const stripGeo = new THREE.BoxGeometry(w, 0.15, 0.06);
        const stripMat = new THREE.MeshStandardMaterial({
          color: 0xc62828,
          roughness: 0.7,
        });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0, wh - 0.1, -d / 2 + 0.04);
        group.add(strip);
      }
    }

    // recenter camera target on booth
    if (controlsRef.current) {
      controlsRef.current.target.set(0, wh * 0.3, 0);
      controlsRef.current.update();
    }
  }, [booth.width, booth.depth, booth.wallHeight, booth.style, booth.look]);

  /* ---------- visitors walking past the booth ---------- */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !showPeople) return undefined;
    const v = createVisitors(booth.width * MM_TO_M, booth.depth * MM_TO_M);
    scene.add(v.group);
    tickRef.current = v.tick;
    return () => {
      tickRef.current = null;
      scene.remove(v.group);
      v.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    };
  }, [showPeople, booth.width, booth.depth]);

  /* ---------- sync products meshes ---------- */
  useEffect(() => {
    const group = productsGroupRef.current;
    if (!group) return;
    const map = meshMapRef.current;

    const present = new Set(products.map((p) => p.instanceId));

    // remove gone
    for (const [id, mesh] of Array.from(map.entries())) {
      if (!present.has(id)) {
        group.remove(mesh);
        disposeGroup(mesh);
        map.delete(id);
      }
    }

    // add/update
    products.forEach((p) => {
      const tpl = PRODUCT_LIBRARY.find((t) => t.id === p.productId);
      if (!tpl) return;
      let mesh = map.get(p.instanceId);
      const fingerprint = `${p.caption || ''}-${p.width}-${p.depth}-${p.height}-${p.tier}-${p.frameColor}-${p.boardColor}-${p.shelfStyle || 'basic'}-${p.levelsKey || ''}-${
        Array.isArray(p.levels)
          ? p.levels.map((l) => `${l.h}${l.style}`).join('.')
          : ''
      }-${p.hangers || ''}-${p.staffName || ''}|${p.staffSay ?? ''}|${p.staffGlasses ? 'G' : ''}${p.staffHair || ''}${p.staffShirt || ''}-${
        p.showItems
          ? `items${propsReady ? 'R' : ''}${JSON.stringify(p.itemPicks || '')}${p.baseItem || ''}`
          : ''
      }`;
      if (!mesh || mesh.userData.fingerprint !== fingerprint) {
        if (mesh) {
          group.remove(mesh);
          disposeGroup(mesh);
        }
        mesh = buildProductMesh(p, tpl);
        if (BUYER_MODE) mesh.add(makeContactShadow(p.width * MM_TO_M, p.depth * MM_TO_M));
        if (p.caption) {
          const cap = makeSpeechBubble(p.caption, 0.55);
          cap.position.set(0, (p.height * MM_TO_M) + 0.12, 0);
          mesh.add(cap);
        }
        mesh.userData.instanceId = p.instanceId;
        mesh.userData.fingerprint = fingerprint;
        // tag children for picking
        mesh.traverse((c) => {
          c.userData.instanceId = p.instanceId;
        });
        group.add(mesh);
        map.set(p.instanceId, mesh);
      }
      // update transform
      mesh.position.set(p.position.x, 0, p.position.z);
      mesh.rotation.y = ((p.rotation || 0) * Math.PI) / 180;
    });

    // compute warnings
    const w = (booth.width * MM_TO_M) / 2;
    const d = (booth.depth * MM_TO_M) / 2;
    const newWarn = {};
    products.forEach((p) => {
      const halfW =
        ((p.rotation % 180 === 0 ? p.width : p.depth) * MM_TO_M) / 2;
      const halfD =
        ((p.rotation % 180 === 0 ? p.depth : p.width) * MM_TO_M) / 2;
      // bounds check
      if (
        Math.abs(p.position.x) + halfW > w + 0.001 ||
        Math.abs(p.position.z) + halfD > d + 0.001
      ) {
        newWarn[p.instanceId] = 'out_of_bounds';
      }
    });
    // collisions (simple AABB)
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const a = products[i],
          b = products[j];
        const aw = ((a.rotation % 180 === 0 ? a.width : a.depth) * MM_TO_M) / 2;
        const ad = ((a.rotation % 180 === 0 ? a.depth : a.width) * MM_TO_M) / 2;
        const bw = ((b.rotation % 180 === 0 ? b.width : b.depth) * MM_TO_M) / 2;
        const bd = ((b.rotation % 180 === 0 ? b.depth : b.width) * MM_TO_M) / 2;
        const dx = Math.abs(a.position.x - b.position.x);
        const dz = Math.abs(a.position.z - b.position.z);
        if (dx < aw + bw - 0.005 && dz < ad + bd - 0.005) {
          newWarn[a.instanceId] = newWarn[a.instanceId] || 'overlap';
          newWarn[b.instanceId] = newWarn[b.instanceId] || 'overlap';
        }
      }
    }
    setWarnings(newWarn);
  }, [products, booth.width, booth.depth, propsReady]);

  /* ---------- selection / warning highlight ---------- */
  useEffect(() => {
    const map = meshMapRef.current;
    map.forEach((mesh, id) => {
      const isSelected = id === selectedId;
      const hasWarn = !!warnings[id];
      // remove existing outline
      const existing = mesh.getObjectByName('__outline');
      if (existing) {
        mesh.remove(existing);
        existing.geometry.dispose();
        existing.material.dispose();
      }
      if (isSelected || hasWarn) {
        // Build the outline from the product's OWN width/depth/height in
        // local space, then add it as a child of the product group. Because
        // it's a child, it inherits the group's rotation.y automatically —
        // so the outline always stays aligned with the rotated product.
        const p = products.find((pr) => pr.instanceId === id);
        if (!p) return;
        const wM = p.width * MM_TO_M;
        const hM = p.height * MM_TO_M;
        const dM = p.depth * MM_TO_M;
        // small padding so the outline sits just outside the product
        const pad = 0.04;
        const geo = new THREE.BoxGeometry(wM + pad, hM + pad, dM + pad);
        const edges = new THREE.EdgesGeometry(geo);
        const color = hasWarn ? 0xdc2626 : 0x2563eb;
        const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
        const lines = new THREE.LineSegments(edges, mat);
        lines.name = '__outline';
        // product meshes are built with their base at y=0, so the box
        // (centered on its own origin) must be lifted by half the height
        lines.position.set(0, hM / 2, 0);
        mesh.add(lines);
        geo.dispose();
      }
    });
  }, [selectedId, warnings, products]);

  /* ---------- view mode handler ---------- */
  useEffect(() => {
    if (!controlsRef.current) return;
    // far enough back to see the whole booth, including a small 10x10
    const dist = Math.max(booth.width, booth.depth) * MM_TO_M + 3;
    controlsRef.current.setView(viewMode, dist);
  }, [viewMode, booth.width, booth.depth]);

  /* ---------- pointer handlers ---------- */
  const pickInstanceId = useCallback((event) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const productsGroup = productsGroupRef.current;
    if (!renderer || !camera || !productsGroup) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x, y }, camera);
    const hits = ray.intersectObjects(productsGroup.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.instanceId) return o.userData.instanceId;
        o = o.parent;
      }
    }
    return null;
  }, []);

  // like pickInstanceId, but also says which shelf level was hit
  const pickLevelHit = useCallback((event) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const productsGroup = productsGroupRef.current;
    if (!renderer || !camera || !productsGroup) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      { x: ((event.clientX - rect.left) / rect.width) * 2 - 1, y: -((event.clientY - rect.top) / rect.height) * 2 + 1 },
      camera
    );
    const hits = ray.intersectObjects(productsGroup.children, true);
    for (const h of hits) {
      // only solid parts: the selection outline is made of lines
      if (!h.object.isMesh || h.object.isSprite) continue;
      let o = h.object,
        level;
      while (o) {
        if (level === undefined && o.userData && o.userData.hhLevel !== undefined) level = o.userData.hhLevel;
        if (o.userData && o.userData.instanceId) return { id: o.userData.instanceId, level, point: h.point };
        o = o.parent;
      }
    }
    return null;
  }, []);

  // which product can have its levels dragged in 3D, and its levels
  const levelTarget = (id) => {
    const p = productsRef.current.find((q) => q.instanceId === id);
    if (!p) return null;
    const tpl = PRODUCT_LIBRARY.find((t) => t.id === p.productId);
    if (!tpl || !isLevelProduct(tpl) || !HH_LEVEL_TYPES.includes(tpl.type)) return null;
    return { p, levels: hhResolveLevels(p, p.tier || tpl.defaultTier) };
  };

  const getFloorPoint = useCallback((event) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x, y }, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    ray.ray.intersectPlane(plane, point);
    return point;
  }, []);

  const onCanvasMouseDown = (e) => {
    if (e.button !== 0) return; // only left click for products
    if (BUYER_MODE) return;
    // grabbing a level of the shelf that is already selected moves that
    // level up and down instead of moving the shelf
    if (viewMode !== 'top' && selectedId) {
      const hit = pickLevelHit(e);
      const target = hit && hit.id === selectedId && hit.level !== undefined ? levelTarget(hit.id) : null;
      if (target) {
        const cam = cameraRef.current;
        const n = new THREE.Vector3();
        cam.getWorldDirection(n);
        n.y = 0;
        if (n.lengthSq() > 1e-4) {
          n.normalize();
          levelDragRef.current = {
            id: hit.id,
            level: hit.level,
            plane: new THREE.Plane().setFromNormalAndCoplanarPoint(n, hit.point),
            startY: hit.point.y,
            startH: target.levels[hit.level].h,
            levels: target.levels,
          };
          controlsRef.current.enabled = false;
          e.stopPropagation();
          return;
        }
      }
    }
    const id = pickInstanceId(e);
    if (id) {
      setSelectedId(id);
      const product = productsRef.current.find((p) => p.instanceId === id);
      if (!product) return;
      const floorPt = getFloorPoint(e);
      if (!floorPt) return;
      dragRef.current = {
        instanceId: id,
        offsetX: product.position.x - floorPt.x,
        offsetZ: product.position.z - floorPt.z,
        startClientX: e.clientX,
        startClientY: e.clientY,
        moved: false,
      };
      controlsRef.current.enabled = false;
      e.stopPropagation();
    }
  };

  const showLevelTip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLevelTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };
  const onCanvasMouseMove = (e) => {
    const ld = levelDragRef.current;
    if (ld) {
      const renderer = rendererRef.current;
      const rect = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        { x: ((e.clientX - rect.left) / rect.width) * 2 - 1, y: -((e.clientY - rect.top) / rect.height) * 2 + 1 },
        cameraRef.current
      );
      const pt = new THREE.Vector3();
      if (ray.ray.intersectPlane(ld.plane, pt)) {
        const p = productsRef.current.find((q) => q.instanceId === ld.id);
        const next = p && hhMoveLevel(p, ld.levels, ld.level, ld.startH + (pt.y - ld.startY) * 1000);
        if (next) {
          ld.levels = next;
          setProducts((prev) =>
            prev.map((q) => (q.instanceId === ld.id ? { ...q, levels: next, levelsKey: hhLevelKey(q) } : q))
          );
        }
        showLevelTip(e, `${ld.levels[ld.level].h} mm`);
      }
      return;
    }
    const drag = dragRef.current;
    if (!drag) {
      // hovering a level of the selected shelf: show it can be dragged
      if (viewMode !== 'top' && selectedId) {
        const hit = pickLevelHit(e);
        const target = hit && hit.id === selectedId && hit.level !== undefined ? levelTarget(hit.id) : null;
        e.currentTarget.style.cursor = target ? 'ns-resize' : '';
        if (target) showLevelTip(e, `${target.levels[hit.level].h} mm`);
        else if (levelTip) setLevelTip(null);
      }
      return;
    }
    const dx = Math.abs(e.clientX - drag.startClientX);
    const dy = Math.abs(e.clientY - drag.startClientY);
    if (!drag.moved && dx + dy < 4) return;
    drag.moved = true;
    const floorPt = getFloorPoint(e);
    if (!floorPt) return;
    let newX = floorPt.x + drag.offsetX;
    let newZ = floorPt.z + drag.offsetZ;
    const dragged = productsRef.current.find((p) => p.instanceId === drag.instanceId);
    if (dragged) {
      const c = clampToBooth({ ...dragged, position: { x: newX, z: newZ } }, booth.width, booth.depth);
      newX = c.x;
      newZ = c.z;
    }
    // live mesh update for smoothness
    const mesh = meshMapRef.current.get(drag.instanceId);
    if (mesh) {
      mesh.position.x = newX;
      mesh.position.z = newZ;
    }
    drag.lastX = newX;
    drag.lastZ = newZ;
  };

  const onCanvasMouseUp = () => {
    if (levelDragRef.current) {
      levelDragRef.current = null;
      setLevelTip(null);
      if (controlsRef.current) controlsRef.current.enabled = true;
      return;
    }
    const drag = dragRef.current;
    if (drag) {
      if (drag.moved && drag.lastX !== undefined) {
        setProducts((prev) =>
          prev.map((p) =>
            p.instanceId === drag.instanceId
              ? { ...p, position: { x: drag.lastX, z: drag.lastZ } }
              : p
          )
        );
      }
      dragRef.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  };

  // background click to deselect
  const onCanvasClick = (e) => {
    if (dragRef.current) return;
    const id = pickInstanceId(e);
    if (!id) setSelectedId(null);
  };

  /* ---------- product CRUD ---------- */
  const addProduct = useCallback(
    (tpl) => {
      const id = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      // place near front-center of booth
      const placeX = 0;
      const placeZ =
        (booth.depth * MM_TO_M) / 2 -
        (tpl.defaultSize.depth * MM_TO_M) / 2 -
        0.3;
      const newProduct = {
        instanceId: id,
        productId: tpl.id,
        name: tpl.name,
        width: tpl.defaultSize.width,
        depth: tpl.defaultSize.depth,
        height: tpl.defaultSize.height,
        tier: tpl.defaultTier,
        frameColor: tpl.frameColors[0],
        boardColor: tpl.boardColors[0],
        position: { x: placeX, z: placeZ },
        rotation: 0,
        addOns: [],
      };
      setProducts((prev) => [...prev, keepIn(newProduct, booth)]);
      setSelectedId(id);
    },
    [booth]
  );

  const updateSelected = useCallback(
    (patch) => {
      if (!selectedId) return;
      setProducts((prev) =>
        prev.map((p) => (p.instanceId === selectedId ? keepIn({ ...p, ...patch }, booth) : p))
      );
    },
    [selectedId, booth]
  );

  // a smaller booth pulls everything back inside
  useEffect(() => {
    setProducts((prev) => {
      const next = prev.map((p) => keepIn(p, booth));
      return next.some((p, i) => p !== prev[i]) ? next : prev;
    });
  }, [booth.width, booth.depth]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setProducts((prev) => prev.filter((p) => p.instanceId !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const orig = productsRef.current.find((p) => p.instanceId === selectedId);
    if (!orig) return;
    const newId = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const copy = {
      ...orig,
      instanceId: newId,
      position: { x: orig.position.x + 0.3, z: orig.position.z + 0.3 },
    };
    setProducts((prev) => [...prev, keepIn(copy, booth)]);
    setSelectedId(newId);
  }, [selectedId, booth]);

  const rotateSelected = useCallback(() => {
    if (!selectedId) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.instanceId === selectedId
          ? keepIn({ ...p, rotation: ((p.rotation || 0) + 90) % 360 }, booth)
          : p
      )
    );
  }, [selectedId, booth]);

  /* ---------- save / load / export ---------- */
  const saveJSON = () => {
    const data = {
      version: 1,
      layoutName,
      booth,
      products,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(layoutName || 'homedant_booth').replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.booth) setBooth(data.booth);
        if (Array.isArray(data.products)) {
          setProducts(data.products);
          setSelectedId(null);
        }
        if (data.layoutName) setLayoutName(data.layoutName);
      } catch (err) {
        alert(tr('Invalid JSON file: ') + err.message);
      }
    };
    reader.readAsText(file);
  };

  const savePNG = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layoutName || 'booth'}_${Date.now()}.png`;
    a.click();
  };

  /* ---------- buyer proposal image ----------
     The current 3D view at twice the screen resolution, with a band
     underneath: product, size, board, and each colour with its swatch
     and HEX code. Always in English: it goes to overseas buyers.       */
  const exportProposal = async (tpl) => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera || !buyerBase || !tpl) return;
    const prevRatio = renderer.getPixelRatio();
    renderer.setPixelRatio(2);
    renderer.render(scene, camera);
    const shot = new Image();
    shot.src = renderer.domElement.toDataURL('image/png');
    renderer.setPixelRatio(prevRatio);
    renderer.render(scene, camera);
    const logo = new Image();
    logo.src = HOMEDANT_WORDMARK_URL;
    await Promise.all([shot, logo].map((im) => (im.complete ? Promise.resolve() : new Promise((r) => (im.onload = im.onerror = r)))));

    const W = shot.width;
    const k = W / 1600; // scale for text and spacing
    const band = Math.round(360 * k);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = shot.height + band;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(shot, 0, 0);
    x.fillStyle = '#e3e3df';
    x.fillRect(0, shot.height, W, Math.max(1, Math.round(2 * k)));

    const pad = Math.round(56 * k);
    let y = shot.height + Math.round(56 * k);
    const lh = Math.round(44 * k);
    if (logo.width) x.drawImage(logo, pad, y - Math.round(26 * k), Math.round(26 * k * HOMEDANT_WORDMARK_ASPECT), Math.round(26 * k));
    x.textBaseline = 'middle';
    x.fillStyle = '#111111';
    x.font = `600 ${Math.round(34 * k)}px Arial, sans-serif`;
    const name = tpl.name.replace(/^House /, 'HOMEDANT HOUSE ');
    x.fillText(name, pad, y + lh);
    x.fillStyle = '#555555';
    x.font = `${Math.round(24 * k)}px Arial, sans-serif`;
    const tiers = tpl.type === 'open_base' ? buyerBase.tier - 1 : buyerBase.tier;
    const board = buyerBase.boardColor === 'white' ? 'white face up' : 'wood face up';
    const outer = hhOuterLabel(buyerBase);
    x.fillText(
      `Size ${buyerBase.width} x ${buyerBase.depth} x ${buyerBase.height}  ·  Outer dimensions W x D x H: ${outer.mm} (${outer.inch})`,
      pad,
      y + lh * 2
    );
    x.fillText(`${tiers} tiers  ·  Double-sided plywood, ${board}`, pad, y + lh * 2.8);
    x.fillStyle = '#888888';
    x.font = `${Math.round(19 * k)}px Arial, sans-serif`;
    x.fillText(
      'Colors are approximate on screen. Final colors are confirmed with a physical sample.  ' +
        new Date().toISOString().slice(0, 10),
      pad,
      y + lh * 5
    );

    // colour swatches in a row under the size line
    const sw = Math.round(30 * k);
    let cx = pad;
    const cy = y + lh * 3.9;
    x.font = `${Math.round(22 * k)}px Arial, sans-serif`;
    buyerColors.forEach((col) => {
      const hex = '#' + frameHexOf(col).toString(16).padStart(6, '0').toUpperCase();
      const known = SHELF_COLORS.find(([kk]) => kk === col);
      x.fillStyle = hex;
      x.beginPath();
      x.arc(cx + sw / 2, cy, sw / 2, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = '#cccccc';
      x.lineWidth = Math.max(1, k);
      x.stroke();
      x.fillStyle = '#222222';
      const label = (known ? known[1] + '  ' : '') + hex;
      x.fillText(label, cx + sw + Math.round(14 * k), cy);
      cx += sw + Math.round(28 * k) + x.measureText(label).width + Math.round(36 * k);
    });

    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    const colorPart = buyerColors.map((col) => (SHELF_COLORS.find(([kk]) => kk === col) || [col.replace('#', '')])[0]).join('-');
    a.download = `HOMEDANT_${tpl.name.replace(/\s+/g, '')}_${buyerBase.width}x${buyerBase.depth}x${buyerBase.height}_${colorPart}.png`;
    a.click();
  };

  /* ---------- Export Booth Images: front / top / 45° ---------- */
  const exportBoothImages = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!renderer || !scene || !camera || !controls) return;

    // remember current camera state so we can restore it afterward
    const prevPos = camera.position.clone();
    const prevTarget = controls.target.clone();

    const dist = Math.max(booth.width, booth.depth) * MM_TO_M * 1.25;
    const safeName = (layoutName || 'booth').replace(/[^a-zA-Z0-9_-]/g, '_');

    const shots = [
      { mode: 'front', suffix: 'front' },
      { mode: 'top', suffix: 'top' },
      { mode: '3d', suffix: '45deg' },
    ];

    // render + download each view sequentially with a small delay so the
    // browser flushes each canvas frame before the next capture
    let i = 0;
    const doNext = () => {
      if (i >= shots.length) {
        // restore original camera
        camera.position.copy(prevPos);
        controls.target.copy(prevTarget);
        controls.update();
        renderer.render(scene, camera);
        return;
      }
      const shot = shots[i++];
      controls.setView(shot.mode, dist);
      controls.update();
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_booth_${shot.suffix}.png`;
      a.click();
      setTimeout(doNext, 350);
    };
    doNext();
  };

  /* ---------- Design Library (localStorage) ---------- */
  const LIB_KEY = 'homedant_booth_designs';

  // load saved designs once on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIB_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSavedDesigns(arr);
      }
    } catch (err) {
      console.warn('Could not load design library:', err);
    }
  }, []);

  // helper: persist the given list to localStorage
  const persistDesigns = (list) => {
    try {
      window.localStorage.setItem(LIB_KEY, JSON.stringify(list));
    } catch (err) {
      alert(tr('Could not save to browser storage: ') + err.message);
    }
  };

  // brief "Saved ✓" flash, auto-clears after ~1.8s
  const flashSaved = (msg) => {
    setSaveStatus(msg);
    window.setTimeout(() => setSaveStatus(''), 1800);
  };

  // small JPEG of the current view, for the library cards
  const makeThumb = () => {
    const renderer = rendererRef.current;
    if (!renderer || !sceneRef.current || !cameraRef.current) return null;
    renderer.render(sceneRef.current, cameraRef.current);
    const src = renderer.domElement;
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 200;
    const x = c.getContext('2d');
    const s0 = Math.max(320 / src.width, 200 / src.height);
    const w = src.width * s0,
      h = src.height * s0;
    x.drawImage(src, (320 - w) / 2, (200 - h) / 2, w, h);
    return c.toDataURL('image/jpeg', 0.72);
  };
  // what "save" stores, for each app
  const currentWork = () =>
    BUYER_MODE
      ? {
          name: `${buyerBase ? buyerBase.name : ''} · ${buyerColors.map((c) => colorLabel(c).split(' #')[0]).join(', ')}`,
          data: { base: buyerBase, compare: buyerCompare },
          thumbnail: makeThumb(),
        }
      : {
          name: layoutName || 'Booth layout',
          data: { booth: { ...booth }, products: products.map((p) => ({ ...p })), layoutName },
          thumbnail: makeThumb(),
        };
  const openWork = (item) => {
    const d = item.data || {};
    if (BUYER_MODE) {
      if (d.base) setBuyerBase(d.base);
      setBuyerCompare(Array.isArray(d.compare) ? d.compare : []);
    } else {
      if (d.booth) setBooth(d.booth);
      if (Array.isArray(d.products)) setProducts(d.products.map((p) => ({ ...p })));
      setSelectedId(null);
      setLayoutName(item.name);
    }
  };
  /* Save: overwrite the shared item this work came from, or open the
     library to save it somewhere the first time. Ctrl+S does the same. */
  const saveDesign = async () => {
    const code = loadTeamCode();
    if (BUYER_MODE && !cloudId && code && buyerLib.authed) {
      const cur = currentWork();
      const r = await buyerLib.run('booth_save_item', {
        p_item: { kind: 'buyer', name: cur.name, folder_id: buyerFolder, data: cur.data, thumbnail: cur.thumbnail },
      });
      if (r) {
        setCloudId(r.id);
        flashSaved(tr('Saved'));
        return;
      }
    }
    if (cloudId && code) {
      const cur = currentWork();
      try {
        await cloud('booth_save_item', { p_code: code, p_item: { id: cloudId, data: cur.data, thumbnail: cur.thumbnail } });
        flashSaved(tr('Saved'));
        if (BUYER_MODE) buyerLib.refresh();
        return;
      } catch (e) {
        /* fall through to the library, which shows what went wrong */
      }
    }
    setShowCloud(true);
  };
  // designs saved in this browser before the shared library existed
  const localImport = {
    list: savedDesigns.map((d) => ({ name: d.name, data: { booth: d.booth, products: d.products, layoutName: d.name } })),
    done: () => {
      setSavedDesigns([]);
      persistDesigns([]);
    },
  };

  // keep the ref pointing at the latest saveDesign (closes over current state)
  saveDesignRef.current = saveDesign;

  // Ctrl+S / Cmd+S → Save Design (same as the button). Bound once on mount.
  // We intercept the browser's "save page" default and call saveDesign via
  // the ref so it always sees fresh state. Silent mode: if we're already
  // editing a saved design it overwrites without a prompt.
  useEffect(() => {
    const onKeyDown = (e) => {
      const isSaveCombo =
        (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
      if (!isSaveCombo) return;
      e.preventDefault();
      if (saveDesignRef.current) saveDesignRef.current({ silent: true });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ---------- presets ---------- */
  const applyTemplate = (tpl) => {
    if (tpl === '10x10')
      setBooth({
        ...booth,
        width: 10 * MM_PER_FT,
        depth: 10 * MM_PER_FT,
        unit: 'ft',
      });
    else if (tpl === '10x20')
      setBooth({
        ...booth,
        width: 20 * MM_PER_FT,
        depth: 10 * MM_PER_FT,
        unit: 'ft',
      });
    else if (tpl === '20x20')
      setBooth({
        ...booth,
        width: 20 * MM_PER_FT,
        depth: 20 * MM_PER_FT,
        unit: 'ft',
      });
  };

  /* ---------- create a fresh, empty layout ---------- */
  const createLayout = () => {
    // confirm before discarding in-progress work
    if (products.length > 0) {
      const ok = window.confirm(
        tr(
          'Start a new layout? This clears the current booth.\nSave it to the Design Library first if you want to keep it.'
        )
      );
      if (!ok) return;
    }
    setProducts([]);
    setSelectedId(null);
    setWarnings({});
    setLayoutName('layout1');
    setCurrentDesignId(null); // fresh layout — next save creates a new entry
    // reset booth to the default size/style but keep the current unit
    setBooth((b) => ({
      width: 3048,
      depth: 3048,
      wallHeight: 2438,
      unit: b.unit,
      style: 'wall',
      look: b.look || DEFAULT_LOOK,
    }));
  };

  /* ---------- switch booth style (wall / curtain) ---------- */
  const setBoothStyle = (style) => setBooth((b) => ({ ...b, style }));
  const setBoothLook = (look) => setBooth((b) => ({ ...b, look }));

  /* ---------- selected product convenience ---------- */
  const selected = products.find((p) => p.instanceId === selectedId);
  const selectedTpl = selected
    ? PRODUCT_LIBRARY.find((t) => t.id === selected.productId)
    : null;

  // group products by category for left panel
  const filteredProducts = PRODUCT_LIBRARY.filter((p) => !p.hidden).filter((p) =>
    activeBrand === 'SPEEDRACK'
      ? p.brand === 'SPEEDRACK'
      : activeBrand === 'HOMEDANT HOUSE'
      ? p.brand === 'HOMEDANT HOUSE'
      : p.brand === 'Exhibition'
  );

  /* ---------- buyer configurator: what is on the floor ---------- */
  const buyerColors = buyerBase
    ? buyerCompare.length >= 2
      ? buyerCompare
      : [buyerBase.frameColor]
    : [];
  useEffect(() => {
    if (!BUYER_MODE || !buyerBase) return;
    const n = buyerColors.length;
    const step = buyerBase.width * MM_TO_M + 0.45;
    setProducts(
      buyerColors.map((c, i) => ({
        ...buyerBase,
        instanceId: 'b' + i,
        frameColor: c,
        caption: n > 1 ? colorLabel(c) : '',
        position: { x: (i - (n - 1) / 2) * step, z: 0 },
        rotation: 0,
      }))
    );
    setSelectedId(null);
  }, [buyerBase, buyerCompare, lang]);
  // frame the camera on the product(s) when what is shown changes size
  useEffect(() => {
    if (!BUYER_MODE || !buyerBase || !controlsRef.current) return;
    const n = buyerColors.length;
    const totalW = n * (buyerBase.width * MM_TO_M + 0.45);
    const h = buyerBase.height * MM_TO_M;
    controlsRef.current.target.set(0, h * 0.46, 0);
    // a product-photo angle: a little above eye level, turned a bit
    controlsRef.current.setView(
      viewMode,
      Math.max(totalW * 1.15, h * 1.55) + 0.6,
      viewMode === 'front' ? { phi: Math.PI / 2 - 0.06, theta: 0 } : { phi: 1.22, theta: n > 1 ? 0.32 : 0.55 }
    );
  }, [buyerBase && buyerBase.productId, buyerBase && buyerBase.width, buyerBase && buyerBase.height, buyerColors.length, viewMode]);

  /* ============================================================
     RENDER
     ============================================================ */
  if (BUYER_MODE && buyerBase) {
    const tpl = PRODUCT_LIBRARY.find((t) => t.id === buyerBase.productId);
    return (
      <div
        className="h-screen w-screen flex flex-col text-gray-900 overflow-hidden"
        style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}
      >
        <header className="flex-none border-b h-12 px-4 flex items-center gap-3" style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}>
          <button onClick={() => openApp(null)} title={tr('Back to start')}>
            <img src={HOMEDANT_WORDMARK_URL} alt="HOMEDANT" className="h-4" />
          </button>
          <span className="text-gray-300">/</span>
          {(() => {
            const folder = buyerFolder ? buyerLib.folders.find((f) => f.id === buyerFolder) : null;
            const item = cloudId ? buyerLib.items.find((it) => it.id === cloudId) : null;
            return (
              <span className="text-sm min-w-0 truncate">
                <span className={folder ? 'font-semibold' : 'text-gray-500'}>{folder ? folder.name : tr('No buyer selected')}</span>
                <span className="text-gray-300"> / </span>
                <span className="text-gray-500">{item ? item.name : tr('New proposal (not saved)')}</span>
              </span>
            );
          })()}
          <span className="flex-1" />
          {[
            ['en', 'EN'],
            ['ko', '한국어'],
          ].map(([code, name]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={'text-xs px-2 py-1 rounded ' + (lang === code ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-white')}
            >
              {name}
            </button>
          ))}
          {saveStatus && (
            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {saveStatus}
            </span>
          )}
          <button
            onClick={() => saveDesign()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
          >
            <Save className="w-3.5 h-3.5" /> {tr('Save')}
          </button>
          <button
            onClick={savePNG}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
          >
            <Camera className="w-3.5 h-3.5" /> {tr('Save screen')}
          </button>
          <button
            onClick={() => exportProposal(tpl)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-700"
          >
            <Download className="w-3.5 h-3.5" /> {tr('Export proposal image')}
          </button>
        </header>
        <div className="flex-1 flex min-h-0">
          <aside className="flex-none w-72 border-r overflow-y-auto" style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}>
            <BuyerSidebar
              lib={buyerLib}
              folderId={buyerFolder}
              setFolderId={setBuyerFolder}
              cloudId={cloudId}
              productId={buyerBase.productId}
              onManage={() => setShowCloud(true)}
              onOpenItem={async (it) => {
                const full = await buyerLib.get(it.id);
                if (!full) return;
                openWork(full);
                setCloudId(full.id);
                setBuyerFolder(full.folder_id || null);
              }}
              onNewProposal={(fid) => {
                setCloudId(null);
                setBuyerFolder(fid || null);
                setBuyerCompare([]);
              }}
              onPickProduct={(t) => {
                // a different product on a saved proposal starts a new one
                if (cloudId) {
                  setCloudId(null);
                  setBuyerCompare([]);
                }
                setBuyerBase((b) => newBuyerProduct(t, b));
              }}
            />
          </aside>
          <main className="flex-1 relative" style={{ backgroundColor: '#e6e6e3' }}>
            <div ref={mountRef} className="absolute inset-0" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              {[
                ['3d', '3D'],
                ['front', 'Front'],
              ].map(([m, label]) => (
                <ToolBtn key={m} active={viewMode === m} onClick={() => setViewMode(m)}>
                  {tr(label)}
                </ToolBtn>
              ))}
            </div>
            <div className="absolute bottom-3 left-3 text-[11px] text-gray-500 pointer-events-none">
              {tr('L-Drag')} {tr('rotate')} · {tr('R-Drag')} {tr('pan')} · {tr('Wheel')} {tr('zoom')}
            </div>
          </main>
          <aside className="flex-none w-80 border-l overflow-y-auto" style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}>
            <BuyerPanel
              base={buyerBase}
              tpl={tpl}
              setBase={(patch) => setBuyerBase((b) => ({ ...b, ...patch }))}
              compare={buyerCompare}
              setCompare={setBuyerCompare}
            />
          </aside>
        </div>
        {showCloud && (
          <CloudLibrary
            kind="buyer"
            title={tr('Buyer folders')}
            getCurrent={currentWork}
            onOpen={openWork}
            currentId={cloudId}
            setCurrentId={setCloudId}
            onClose={() => {
              setShowCloud(false);
              buyerLib.refresh(loadTeamCode());
            }}
          />
        )}
      </div>
    );
  }
  return (
    <div
      className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}
    >
      {/* TOP BAR: layout on the left, the show in the middle, file
          actions on the right */}
      <header
        className="flex-none border-b relative z-30"
        style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}
      >
        <div className="px-4 h-12 grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => openApp(null)} title={tr('Back to start')} className="flex-none">
              <img src={HOMEDANT_WORDMARK_URL} alt="HOMEDANT" className="h-4" />
            </button>
            <span className="text-gray-300">/</span>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder={tr('layout name')}
              className="text-sm text-gray-800 bg-transparent border border-transparent hover:border-gray-300 focus:border-gray-400 focus:bg-white rounded px-1.5 py-1 w-36 outline-none"
              title={tr('Used in exported PNG filenames')}
            />
            <button
              onClick={createLayout}
              title={tr('Start a new, empty booth layout')}
              className="p-1.5 rounded text-gray-500 hover:bg-white hover:text-gray-900"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            {saveStatus && (
              <span className="text-xs text-gray-500 inline-flex items-center gap-1 whitespace-nowrap">
                <Check className="w-3.5 h-3.5" /> {saveStatus}
              </span>
            )}
          </div>

          {/* the show this booth is for */}
          <input
            type="text"
            value={booth.show || ''}
            onChange={(e) => setBooth({ ...booth, show: e.target.value })}
            placeholder={tr('Type the show name')}
            title={tr('Show name')}
            className="text-center text-base font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal bg-transparent border border-transparent hover:border-gray-300 focus:border-gray-400 focus:bg-white rounded px-3 py-1 outline-none"
            style={{ width: 'min(42vw, 520px)' }}
          />

          <div className="flex items-center gap-1.5 justify-end">
            <MenuButton
              open={openMenu === 'designs'}
              onToggle={() => setOpenMenu(openMenu === 'designs' ? null : 'designs')}
              icon={<FolderOpen className="w-3.5 h-3.5" />}
              label={tr('My designs')}
            >
              <MenuItem
                onClick={() => {
                  setShowCloud(true);
                  setOpenMenu(null);
                }}
              >
                <Layers className="w-3.5 h-3.5" /> {tr('Design library')}
              </MenuItem>
              <label className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> {tr('Open JSON file')}
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      loadJSON(e.target.files[0]);
                      e.target.value = '';
                    }
                    setOpenMenu(null);
                  }}
                />
              </label>
            </MenuButton>
            <MenuButton
              open={openMenu === 'export'}
              onToggle={() => setOpenMenu(openMenu === 'export' ? null : 'export')}
              icon={<Download className="w-3.5 h-3.5" />}
              label={tr('Export')}
            >
              <MenuItem
                onClick={() => {
                  setOpenMenu(null);
                  savePNG();
                }}
              >
                <Camera className="w-3.5 h-3.5" /> {tr('Current view (PNG)')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setOpenMenu(null);
                  exportBoothImages();
                }}
              >
                <Camera className="w-3.5 h-3.5" /> {tr('Front, top and 45° (3 PNGs)')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setOpenMenu(null);
                  saveJSON();
                }}
              >
                <Download className="w-3.5 h-3.5" /> {tr('Layout file (JSON)')}
              </MenuItem>
            </MenuButton>
            <button
              onClick={() => saveDesign()}
              title={tr('Save this booth design to the in-app library')}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-700"
            >
              <Save className="w-3.5 h-3.5" /> {tr('Save')}
            </button>
            <MenuButton
              open={openMenu === 'settings'}
              onToggle={() => setOpenMenu(openMenu === 'settings' ? null : 'settings')}
              icon={<Settings className="w-4 h-4" />}
              iconOnly
              label={tr('Language')}
            >
              <div className="px-3 pt-2 pb-1 text-[11px] text-gray-500">{tr('Language')}</div>
              {[
                ['en', 'English'],
                ['ko', '한국어'],
              ].map(([code, name]) => (
                <MenuItem
                  key={code}
                  onClick={() => {
                    setLang(code);
                    setOpenMenu(null);
                  }}
                >
                  <span className="w-3.5">{lang === code && <Check className="w-3.5 h-3.5" />}</span> {name}
                </MenuItem>
              ))}
            </MenuButton>
          </div>
        </div>
      </header>
      {/* clicking anywhere else closes an open menu */}
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}

      {/* MAIN AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <aside className="flex-none w-72 border-r flex flex-col" style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}>
          <div className="flex-none border-b border-gray-200 px-3 py-2.5">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
              {tr('Product Library')}
            </div>
            <div className="flex gap-1">
              {LIBRARY_BRANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setActiveBrand(b)}
                  title={b === 'HOMEDANT HOUSE' ? 'Homedant House' : undefined}
                  className={`flex-1 h-8 flex items-center justify-center text-xs font-medium px-2 rounded border-2 transition ${
                    activeBrand === b
                      ? 'bg-white text-gray-900 border-gray-900'
                      : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {b === 'HOMEDANT HOUSE' ? (
                    <img
                      src={HOMEDANT_WORDMARK_URL}
                      alt="Homedant House"
                      className="h-3.5 w-auto"
                      style={{ opacity: activeBrand === b ? 1 : 0.6 }}
                    />
                  ) : b === 'SPEEDRACK' ? (
                    'SPEEDRACK'
                  ) : (
                    tr('EXHIBITION')
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {filteredProducts.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => addProduct(tpl)}
                className="w-full text-left px-2.5 py-2 rounded border border-gray-200 hover:border-red-500 hover:bg-red-50 transition group"
              >
                <div className="flex items-center gap-2">
                  <ProductThumb type={tpl.type} tpl={tpl} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {tr(tpl.name)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tpl.defaultSize.width}×{tpl.defaultSize.depth}×
                      {tpl.defaultSize.height}mm
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-600" />
                </div>
              </button>
            ))}
          </div>
          <div className="flex-none border-t border-gray-200 px-3 py-3 bg-white flex items-center justify-center">
            <img
              src={HOMEDANT_LOGO_URL}
              alt="HOMEDANT"
              className="h-20 w-auto"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div className="flex-none border-t border-gray-200 px-3 py-2 bg-gray-50">
            <div className="text-xs text-gray-500">
              <div className="flex justify-between">
                <span>{tr('Items placed')}</span>
                <b className="text-gray-700">{products.length}</b>
              </div>
              <div className="flex justify-between">
                <span>{tr('Layout Check')}</span>
                <b
                  className={
                    Object.keys(warnings).length
                      ? 'text-amber-600'
                      : 'text-gray-700'
                  }
                >
                  {Object.keys(warnings).length}
                </b>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER 3D CANVAS */}
        <main
          className="flex-1 relative"
          style={{ backgroundColor: '#dcdde0' }}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onClick={onCanvasClick}
        >
          <div ref={mountRef} className="absolute inset-0" />
          {/* booth size: click to open the booth settings */}
          <div
            className="absolute top-3 left-3 z-30"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenMenu(openMenu === 'booth' ? null : 'booth')}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-left text-xs leading-snug hover:border-gray-400 shadow-sm"
            >
              <div className="font-medium text-gray-900 flex items-center gap-1">
                {fromMM(booth.width, booth.unit)} × {fromMM(booth.depth, booth.unit)} {booth.unit}
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="text-gray-500">
                {tr(booth.style === 'curtain' ? 'Curtain Booth' : 'Wall Booth')} · {tr('wall')}{' '}
                {fromMM(booth.wallHeight, booth.unit)}
                {booth.unit}
              </div>
            </button>
            {openMenu === 'booth' && (
              <div className="mt-1.5 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-3">
                <div className="text-xs font-medium text-gray-900">{tr('Booth settings')}</div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">{tr('Templates')}</div>
                  <div className="flex gap-1">
                    {['10x10', '10x20', '20x20'].map((t) => (
                      <PresetBtn key={t} onClick={() => applyTemplate(t)}>
                        {t.replace('x', '×')} ft
                      </PresetBtn>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">{tr('Size')}</div>
                  <div className="flex flex-col gap-1.5">
                    <NumInput label={tr('Width')} valueMM={booth.width} unit={booth.unit} onChange={(mm) => setBooth({ ...booth, width: mm })} />
                    <NumInput label={tr('Depth')} valueMM={booth.depth} unit={booth.unit} onChange={(mm) => setBooth({ ...booth, depth: mm })} />
                    <NumInput label={tr('Wall H')} valueMM={booth.wallHeight} unit={booth.unit} onChange={(mm) => setBooth({ ...booth, wallHeight: mm })} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">{tr('Unit')}</div>
                  <div className="flex gap-1">
                    {['ft', 'm', 'cm', 'mm'].map((u) => (
                      <button
                        key={u}
                        onClick={() => setBooth({ ...booth, unit: u })}
                        className={
                          'flex-1 text-xs py-1 rounded border ' +
                          (booth.unit === u ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                        }
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">{tr('Booth Type')}</div>
                  <div className="flex gap-1">
                    {[
                      ['wall', 'Wall Booth', 'Solid panel walls'],
                      ['curtain', 'Curtain Booth', 'Pole frame with fabric curtains'],
                    ].map(([k, label, hint]) => (
                      <button
                        key={k}
                        onClick={() => setBoothStyle(k)}
                        title={tr(hint)}
                        className={
                          'flex-1 text-xs py-1 rounded border ' +
                          (booth.style === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                        }
                      >
                        {tr(label)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {levelTip && (
            <div
              className="absolute z-20 pointer-events-none bg-gray-900 text-white text-xs font-medium rounded px-2 py-1 tabular-nums"
              style={{ left: levelTip.x + 14, top: levelTip.y - 12 }}
            >
              {levelTip.text}
            </div>
          )}
          {/* view toolbar: what you look at, and how */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-1 shadow-sm whitespace-nowrap"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {[
              ['3d', <Box key="i" className="w-3.5 h-3.5" />, '3D'],
              ['top', <Grid3x3 key="i" className="w-3.5 h-3.5" />, 'Top'],
              ['front', <Eye key="i" className="w-3.5 h-3.5" />, 'Front'],
            ].map(([m, icon, label]) => (
              <ToolBtn key={m} active={viewMode === m} onClick={() => setViewMode(m)}>
                {icon} {tr(label)}
              </ToolBtn>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            {Object.entries(BOOTH_LOOKS).filter(([key]) => key !== 'studio').map(([key, lk]) => (
              <ToolBtn key={key} active={(booth.look || DEFAULT_LOOK) === key} onClick={() => setBoothLook(key)} title={tr(lk.hint)}>
                {tr(lk.label)}
              </ToolBtn>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn active={showPeople} onClick={() => setShowPeople((v) => !v)} title={tr('Show people walking past the booth')}>
              <Footprints className="w-3.5 h-3.5" /> {tr('Visitors')}
            </ToolBtn>
            <ToolBtn onClick={savePNG} title={tr('Save current view as PNG')}>
              <Camera className="w-3.5 h-3.5" />
            </ToolBtn>
          </div>
          <div className="absolute bottom-3 left-3 text-[11px] text-gray-500 pointer-events-none">
            {tr('L-Drag')} {tr('rotate')} · {tr('R-Drag')} {tr('pan')} · {tr('Wheel')} {tr('zoom')}
          </div>
          {Object.keys(warnings).length > 0 &&
            (() => {
              // group flagged items by reason for a clear breakdown
              const counts = {};
              Object.values(warnings).forEach((r) => {
                counts[r] = (counts[r] || 0) + 1;
              });
              // per-item detail (product name + reason)
              const items = Object.entries(warnings).map(([id, reason]) => {
                const prod = products.find((pr) => pr.instanceId === id);
                const tpl = prod
                  ? PRODUCT_LIBRARY.find((t) => t.id === prod.productId)
                  : null;
                const name = prod
                  ? prod.name || (tpl && tpl.name) || 'Product'
                  : 'Product';
                return { id, name, reason };
              });
              const total = Object.keys(warnings).length;
              return (
                <div className="absolute top-3 right-3 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2.5 text-xs text-amber-900 max-w-xs shadow-sm">
                  <div className="flex items-center gap-1.5 font-semibold mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                    {tr('Layout Check')}: {total}
                    {tr(total > 1 ? ' items need attention' : ' item needs attention')}
                  </div>
                  {/* by-cause summary */}
                  <div className="space-y-0.5 mb-1.5">
                    {Object.entries(counts).map(([reason, n]) => (
                      <div
                        key={reason}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-amber-700">
                          {tr(WARNING_REASON_SHORT[reason] || 'Placement review')}
                        </span>
                        <span className="font-medium">
                          {n}
                          {tr(n > 1 ? ' items' : ' item')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* per-item detail */}
                  <div className="border-t border-amber-200 pt-1.5 space-y-0.5">
                    {items.map((it) => (
                      <div key={it.id} className="leading-snug">
                        <span className="font-medium">{tr(it.name)}</span>
                        <span className="text-amber-700">
                          {' '}
                          · {warningReasonLabel(it.reason)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-amber-600 mt-1.5 text-xs leading-snug">
                    {tr(
                      'These are placement reminders, not errors. Adjust positions to clear them.'
                    )}
                  </div>
                </div>
              );
            })()}
        </main>

        {/* RIGHT PANEL */}
        <aside className="flex-none w-80 border-l flex flex-col" style={{ backgroundColor: UI_PANEL, borderColor: UI_LINE }}>
          {!selected ? (
            <BoothOverview products={products} warnings={warnings} onSelect={setSelectedId} />
          ) : (
            <PropertyPanel
              product={selected}
              tpl={selectedTpl}
              warning={warnings[selected.instanceId]}
              update={updateSelected}
              rotate={rotateSelected}
              duplicate={duplicateSelected}
              del={deleteSelected}
              boothSize={{ w: booth.width, d: booth.depth }}
            />
          )}
        </aside>
      </div>
      {showCloud && (
        <CloudLibrary
          kind="booth"
          title={tr('Booth layouts')}
          getCurrent={currentWork}
          onOpen={openWork}
          currentId={cloudId}
          setCurrentId={setCloudId}
          onClose={() => setShowCloud(false)}
          localImport={localImport}
        />
      )}
    </div>
  );
}

/* ============================================================
   PROPERTY PANEL (right side)
   ============================================================ */
function PropertyPanel({
  product,
  tpl,
  warning,
  update,
  rotate,
  duplicate,
  del,
  boothSize,
}) {
  // which tabs this product has: basic is always there
  const [tab, setTab] = useState('basic');
  if (!tpl) return null;
  const isHH = isLevelProduct(tpl);
  const tabs = [['basic', 'Basic']];
  if (isHH && HH_LEVEL_TYPES.includes(tpl.type)) tabs.push(['levels', 'Levels']);
  if (isHH && HH_ITEM_TYPES.includes(tpl.type)) tabs.push(['items', 'Display']);
  const current = tabs.some(([k]) => k === tab) ? tab : 'basic';
  const iconBtn = 'p-1.5 rounded text-gray-500 hover:bg-white hover:text-gray-900';
  const xMin = (-boothSize.w * MM_TO_M) / 2;
  const xMax = (boothSize.w * MM_TO_M) / 2;
  const zMin = (-boothSize.d * MM_TO_M) / 2;
  const zMax = (boothSize.d * MM_TO_M) / 2;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* name, with the actions you reach for most */}
      <div className="flex-none px-4 pt-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-gray-500 truncate">
              {tpl.brand === 'HOMEDANT HOUSE' ? 'HOMEDANT HOUSE' : tr(tpl.category)}
            </div>
            <div className="font-semibold text-sm leading-tight mt-0.5 truncate">{tr(product.name)}</div>
          </div>
          <button onClick={rotate} title={tr('Rotate') + ' 90°'} className={iconBtn}>
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={duplicate} title={tr('Duplicate')} className={iconBtn}>
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={del} title={tr('Delete')} className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {warning && (
          <div className="mt-2">
      
        <span
          className="flex-none inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium"
          title={warningReasonLabel(warning)}
        >
          <AlertTriangle className="w-3 h-3" />
          {tr(WARNING_REASON_SHORT[warning] || 'Review')}
        </span>
          </div>
        )}
      </div>

      {tabs.length > 1 && (
        <div className="flex-none flex gap-1 px-4 pb-2 border-b" style={{ borderColor: UI_LINE }}>
          {tabs.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                'flex-1 text-xs py-1.5 rounded transition ' +
                (current === k ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-white')
              }
            >
              {tr(label)}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {current === 'basic' && (
          <>
      {/* dimensions */}
      <Section title={tr('Dimensions')}>
        <SizeSelect
          label={tr('Width')}
          value={product.width}
          options={tpl.sizeOptions.width}
          onChange={(v) => update({ width: v })}
        />
        <SizeSelect
          label={tr('Depth')}
          value={product.depth}
          options={tpl.sizeOptions.depth}
          onChange={(v) => update({ depth: v })}
        />
        <SizeSelect
          label={tr('Height')}
          value={product.height}
          options={tpl.sizeOptions.height}
          onChange={(v) => update({ height: v, tier: fitTier(tpl, { ...product, height: v }) })}
        />
        {tpl.tierOptions.length > 1 && (
          <Field label={tr('Tier')}>
            <select
              value={product.tier}
              onChange={(e) => update({ tier: parseInt(e.target.value, 10) })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {tierChoices(tpl, product).map((t) => (
                <option key={t} value={t}>
                  {tpl.type === 'open_base' ? t - 1 : t}
                  {tr('-Tier')}
                </option>
              ))}
            </select>
          </Field>
        )}
        {isLevelProduct(tpl) && tpl.type === 'garment' && product.tier >= 3 && (
          <Field label={tr('Hanger bars')}>
            <div className="flex gap-1.5">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => update({ hangers: n })}
                  className={`flex-1 text-xs py-1.5 rounded border transition ${
                    hhHangerCount(product, product.tier) === n
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
        )}
      </Section>

      {tpl.type === 'staff' && <StaffEditor product={product} update={update} fixed={!!tpl.preset} />}

      {/* colors */}
      {tpl.type !== 'staff' && (
      <Section title={tr('Colors')}>
        <Field label={tr('Frame')}>
          <div className="flex gap-1.5">
            {tpl.frameColors.map((c) => (
              <button
                key={c}
                onClick={() => update({ frameColor: c })}
                className={`flex-1 text-xs py-1.5 rounded border transition ${
                  product.frameColor === c
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tr(c)}
              </button>
            ))}
          </div>
        </Field>
        <Field label={tr('Board')}>
          <div className="flex gap-1.5">
            {tpl.boardColors.map((c) => (
              <button
                key={c}
                onClick={() => update({ boardColor: c })}
                className={`flex-1 text-xs py-1.5 rounded border transition ${
                  product.boardColor === c
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tr(c)}
              </button>
            ))}
          </div>
        </Field>
        {tpl.brand === 'HOMEDANT HOUSE' && (
          <Field label={tr('Shelf style (all levels)')}>
            <div className="flex gap-1.5">
              {['basic', 'basket'].map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    update({
                      shelfStyle: c,
                      levels: Array.isArray(product.levels)
                        ? product.levels.map((l) => ({ ...l, style: c }))
                        : product.levels,
                    })
                  }
                  className={`flex-1 text-xs py-1.5 rounded border transition ${
                    (product.shelfStyle || 'basic') === c
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tr(c)}
                </button>
              ))}
            </div>
          </Field>
        )}
      </Section>
      )}

      {/* add-ons */}
      {tpl.addOns.length > 0 && (
        <Section title={tr('Add-on Options')}>
          <div className="grid grid-cols-2 gap-1">
            {tpl.addOns.map((a) => {
              const active = (product.addOns || []).includes(a);
              return (
                <button
                  key={a}
                  onClick={() => {
                    const cur = product.addOns || [];
                    update({
                      addOns: active ? cur.filter((x) => x !== a) : [...cur, a],
                    });
                  }}
                  className={`text-xs py-1 px-1.5 rounded border transition truncate ${
                    active
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tr(a)}
                </button>
              );
            })}
          </div>
        </Section>
      )}


            <details className="border-b border-gray-200">
              <summary className="px-4 py-2.5 text-xs text-gray-500 cursor-pointer select-none">
                {tr('Enter position')}
              </summary>
          <div className="px-4 pb-3">
        <Field label={tr('X (m)')}>
          <input
            type="number"
            step="0.05"
            value={product.position.x.toFixed(2)}
            onChange={(e) =>
              update({
                position: {
                  ...product.position,
                  x: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
          />
          <div className="text-xs text-gray-400 mt-0.5">
            {tr('Range')} {xMin.toFixed(2)} ↔ {xMax.toFixed(2)}
          </div>
        </Field>
        <Field label={tr('Z (m)')}>
          <input
            type="number"
            step="0.05"
            value={product.position.z.toFixed(2)}
            onChange={(e) =>
              update({
                position: {
                  ...product.position,
                  z: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
          />
          <div className="text-xs text-gray-400 mt-0.5">
            {tr('Range')} {zMin.toFixed(2)} ↔ {zMax.toFixed(2)}
          </div>
        </Field>
        <Field label={tr('Rotation')}>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50">
              {product.rotation || 0}°
            </div>
            <button
              onClick={rotate}
              className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 inline-flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" /> +90°
            </button>
          </div>
        </Field>
          </div>


            </details>
          </>
        )}
        {current === 'levels' && (
          <>
      {isLevelProduct(tpl) && HH_LEVEL_TYPES.includes(tpl.type) && (
        <HHLevelEditor product={product} tpl={tpl} update={update} />
      )}


          </>
        )}
        {current === 'items' && (
          <>
      {isLevelProduct(tpl) && HH_ITEM_TYPES.includes(tpl.type) && (
        <HHItemEditor product={product} tpl={tpl} update={update} />
      )}


          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SMALL UI HELPERS
   ============================================================ */
function NumInput({ label, valueMM, unit, onChange }) {
  const [str, setStr] = useState(fromMM(valueMM, unit).toString());
  useEffect(() => {
    setStr(fromMM(valueMM, unit).toString());
  }, [valueMM, unit]);
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type="number"
        step="0.1"
        value={str}
        onChange={(e) => setStr(e.target.value)}
        onBlur={() => {
          const num = parseFloat(str);
          if (!isNaN(num) && num > 0) onChange(toMM(num, unit));
          else setStr(fromMM(valueMM, unit).toString());
        }}
        className="w-16 text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
      />
    </label>
  );
}

const BUYER_TEMPLATES = PRODUCT_LIBRARY.filter(
  (t) => t.brand === 'HOMEDANT HOUSE' && t.type !== 'cabinet'
);
// a fresh product for the buyer view; keeps the colours already chosen
function newBuyerProduct(tpl, keep) {
  const boards = tpl.boardColors;
  return {
    instanceId: 'b0',
    productId: tpl.id,
    name: tpl.name,
    width: tpl.defaultSize.width,
    depth: tpl.defaultSize.depth,
    height: tpl.defaultSize.height,
    // an ordinary shelf is shown at 4 levels, like the usual buyer photos
    tier: tpl.type === 'shelf' && tpl.tierOptions.includes(4) ? 4 : tpl.defaultTier,
    frameColor: keep ? keep.frameColor : 'white',
    boardColor: keep && boards.includes(keep.boardColor) ? keep.boardColor : tpl.boardColors[0],
    shelfStyle: keep ? keep.shelfStyle : undefined,
    position: { x: 0, z: 0 },
    rotation: 0,
    addOns: [],
  };
}

function BuyerPanel({ base, tpl, setBase, compare, setCompare }) {
  if (!tpl) return null;
  const hex = '#' + frameHexOf(base.frameColor).toString(16).padStart(6, '0');
  const btn = (on) =>
    'flex-1 text-xs py-1.5 rounded border transition ' +
    (on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50');
  const swatch = ([k, name, h]) => (
    <button
      key={k}
      onClick={() => setBase({ frameColor: k })}
      title={tr(name)}
      className={'flex flex-col items-center gap-1 p-1 rounded ' + (base.frameColor === k ? 'bg-white ring-2 ring-gray-900' : 'hover:bg-white')}
    >
      <span
        className="w-9 h-9 rounded-full border border-gray-300"
        style={{ backgroundColor: '#' + h.toString(16).padStart(6, '0') }}
      />
      <span className="text-[11px] text-gray-700 leading-tight text-center">{tr(name)}</span>
    </button>
  );
  const inCompare = compare.includes(base.frameColor);
  return (
    <div>
      <div className="px-4 pt-3 pb-2">
        <div className="text-[11px] text-gray-500">HOMEDANT HOUSE</div>
        <div className="font-semibold text-sm">{tr(base.name)}</div>
      </div>
      <Section title={tr('Size')}>
        <SizeSelect label={tr('Width')} value={base.width} options={tpl.sizeOptions.width} onChange={(v) => setBase({ width: v })} />
        <SizeSelect label={tr('Depth')} value={base.depth} options={tpl.sizeOptions.depth} onChange={(v) => setBase({ depth: v })} />
        <SizeSelect
          label={tr('Height')}
          value={base.height}
          options={tpl.sizeOptions.height}
          onChange={(v) => setBase({ height: v, tier: fitTier(tpl, { ...base, height: v }) })}
        />
        <div className="text-[11px] text-gray-500 -mt-1 mb-2 leading-snug">
          {tr('Outer size')}: {hhOuterLabel(base).mm}
          <br />
          <span className="text-gray-400">{hhOuterLabel(base).inch}</span>
        </div>
        {tpl.tierOptions.length > 1 && (
          <Field label={tr('Tiers')}>
            <div className="flex gap-1">
              {tierChoices(tpl, base).map((t) => (
                <button key={t} onClick={() => setBase({ tier: t })} className={btn(base.tier === t)}>
                  {tpl.type === 'open_base' ? t - 1 : t}
                </button>
              ))}
            </div>
          </Field>
        )}
      </Section>
      <Section title={tr('Frame color')}>
        <div className="text-[11px] text-gray-500 mb-1">{tr('Standard')}</div>
        <div className="grid grid-cols-4 gap-1 mb-2">{SHELF_COLORS.filter((c) => c[3] === 'standard').map(swatch)}</div>
        <div className="text-[11px] text-gray-500 mb-1">{tr('New color proposals')}</div>
        <div className="grid grid-cols-4 gap-1 mb-2">{SHELF_COLORS.filter((c) => c[3] === 'new').map(swatch)}</div>
        <div className="text-[11px] text-gray-500 mb-1">{tr('Custom color')}</div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => setBase({ frameColor: e.target.value.toLowerCase() })}
            className="w-9 h-8 p-0 border border-gray-300 rounded bg-white cursor-pointer"
          />
          <input
            type="text"
            value={hex.toUpperCase()}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (/^#[0-9a-f]{6}$/i.test(v)) setBase({ frameColor: v.toLowerCase() });
            }}
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 bg-white font-mono"
          />
        </div>
        <div className="text-xs text-gray-700 mt-2">
          {tr('Selected')}: <span className="font-medium">{colorLabel(base.frameColor)}</span>
        </div>
      </Section>
      <Section title={tr('Plywood board')}>
        <div className="flex gap-1.5">
          {tpl.boardColors.map((b) => (
            <button key={b} onClick={() => setBase({ boardColor: b })} className={btn(base.boardColor === b)}>
              {tr(b === 'wood' ? 'Wood face up' : 'White face up')}
            </button>
          ))}
        </div>
        {HH_LEVEL_TYPES.includes(tpl.type) && (
          <div className="flex gap-1.5 mt-2">
            {['basic', 'basket'].map((st) => (
              <button key={st} onClick={() => setBase({ shelfStyle: st })} className={btn((base.shelfStyle || 'basic') === st)}>
                {st}
              </button>
            ))}
          </div>
        )}
      </Section>
      <Section title={tr('Compare colors')}>
        <div className="text-xs text-gray-500 mb-2">{tr('Add 2 to 4 colors to see them side by side.')}</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {compare.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-300 rounded-full pl-1 pr-2 py-0.5">
              <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: '#' + frameHexOf(c).toString(16).padStart(6, '0') }} />
              {colorLabel(c)}
              <button onClick={() => setCompare(compare.filter((x) => x !== c))} className="text-gray-400 hover:text-gray-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => !inCompare && compare.length < 4 && setCompare([...compare, base.frameColor])}
            className={btn(false) + (inCompare || compare.length >= 4 ? ' opacity-50 cursor-default' : '')}
          >
            {tr('Add selected color')}
          </button>
          {compare.length > 0 && (
            <button onClick={() => setCompare([])} className={btn(false)}>
              {tr('Clear')}
            </button>
          )}
        </div>
      </Section>
      <div className="px-4 py-3 text-[11px] text-gray-500 leading-relaxed">
        {tr('Colors on screen are approximate. Final colors are confirmed with a physical sample.')}
      </div>
    </div>
  );
}

/* Right panel when nothing is selected: what is in the booth, and any
   placement reminders. Click a line to select that product.           */
function BoothOverview({ products, warnings, onSelect }) {
  const nWarn = Object.keys(warnings).length;
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="text-sm font-semibold text-gray-900 mb-1">{tr('In this booth')}</div>
      <div className="text-xs text-gray-500 mb-3">
        {products.length
          ? tr('Click a product here or in the 3D view to edit it.')
          : tr('Add products from the list on the left.')}
      </div>
      {products.map((p) => (
        <button
          key={p.instanceId}
          onClick={() => onSelect(p.instanceId)}
          className="w-full flex items-center gap-2 text-left text-xs px-2.5 py-2 mb-1 rounded bg-white border border-gray-200 hover:border-gray-400"
        >
          <span className="flex-1 truncate text-gray-800">{tr(p.name)}</span>
          <span className="text-gray-400 tabular-nums">
            {p.width}×{p.depth}×{p.height}
          </span>
          {warnings[p.instanceId] && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-none" />}
        </button>
      ))}
      {nWarn > 0 && (
        <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
          {tr('Layout Check')}: {nWarn}
          {tr(nWarn > 1 ? ' items need attention' : ' item needs attention')}
        </div>
      )}
    </div>
  );
}

function MenuButton({ open, onToggle, icon, label, iconOnly, children }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        title={iconOnly ? label : undefined}
        className={
          'inline-flex items-center gap-1 text-xs rounded border transition ' +
          (iconOnly ? 'p-1.5 ' : 'px-2.5 py-1.5 ') +
          (open ? 'bg-white border-gray-400 text-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400')
        }
      >
        {icon}
        {!iconOnly && (
          <>
            {label}
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40">
          {children}
        </div>
      )}
    </div>
  );
}
function MenuItem({ onClick, children }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left whitespace-nowrap">
      {children}
    </button>
  );
}
function ToolBtn({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={
        'inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition ' +
        (active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100')
      }
    >
      {children}
    </button>
  );
}

function PresetBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-1 border border-gray-300 rounded hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition"
    >
      {children}
    </button>
  );
}

function ViewBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded border transition ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition"
    >
      {children}
    </button>
  );
}

/* Display items for a HOMEDANT HOUSE shelf: switch them on or off, and
   when on, choose what sits in each slot of each level. "Auto" lets the
   simulator pick; "None" leaves the slot empty. Top level listed first. */
function HHItemEditor({ product, tpl, update }) {
  const tiers = tpl.type === 'drawer' ? 2 : product.tier || tpl.defaultTier;
  const levels = hhResolveLevels(product, tiers);
  const first = tpl.type === 'open_base' ? 1 : 0;
  const picks = product.itemPicks || {};
  const setPick = (i, k, value, slots) => {
    const row = Array.from({ length: slots }, (_, n) => (picks[i] && picks[i][n]) || 'auto');
    row[k] = value;
    update({ itemPicks: { ...picks, [i]: row } });
  };
  // Open Base: what stands in the open space on the floor. Picking the
  // washing machine lifts the levels above it when they are too low.
  const setBase = (value) => {
    const patch = { baseItem: value === 'none' ? undefined : value };
    const n = levels.length;
    const need =
      HH_LEVEL_MIN +
      Math.ceil((WASHER.h * 1000 + 10 + HH.beamH * 1000 + 9 - HH_LEVEL_MIN) / HH_LEVEL_STEP) * HH_LEVEL_STEP;
    if (value === 'washer' && n >= 3 && levels[1].h < need && product.height - need >= (n - 2) * HH_LEVEL_GAP) {
      const span = product.height - need;
      const next = levels.map((l, i) =>
        i === 0
          ? l
          : i === n - 1
          ? { ...l, h: product.height }
          : { ...l, h: need + Math.round((((i - 1) / (n - 2)) * span) / HH_LEVEL_STEP) * HH_LEVEL_STEP }
      );
      for (let i = n - 2; i >= 1; i--) next[i].h = Math.min(next[i].h, next[i + 1].h - HH_LEVEL_GAP);
      patch.levels = next;
      patch.levelsKey = hhLevelKey(product);
    }
    update(patch);
  };
  const washerOut =
    product.baseItem === 'washer' &&
    washerScale(product.width * MM_TO_M, hhOpenBaseRoom(product, levels)) < 0.85;
  const rows = [];
  if (product.showItems) {
    for (let i = levels.length - 1; i >= first; i--) {
      const slots = displaySlotCount(product.width * MM_TO_M, levels[i].style === 'basket');
      rows.push(
        <div key={i} className="flex items-center gap-1.5 mb-1.5">
          <span className="flex-none w-4 text-xs text-gray-500">{i + 1 - first}</span>
          {Array.from({ length: slots }, (_, k) => (
            <select
              key={k}
              value={(picks[i] && picks[i][k]) || 'auto'}
              onChange={(e) => setPick(i, k, e.target.value, slots)}
              className="flex-1 min-w-0 text-xs border border-gray-300 rounded px-1 py-1 bg-white"
            >
              <option value="auto">{tr('Auto')}</option>
              <option value="none">{tr('None')}</option>
              {DISPLAY_ITEMS.map(([key, label]) => (
                <option key={key} value={key}>
                  {tr(label)}
                </option>
              ))}
            </select>
          ))}
        </div>
      );
    }
  }
  return (
    <Section title={tr('Display items')}>
      <div className="flex gap-1.5">
        {[false, true].map((on) => (
          <button
            key={String(on)}
            onClick={() => update({ showItems: on })}
            className={`flex-1 text-xs py-1.5 rounded border transition ${
              !!product.showItems === on
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tr(on ? 'on' : 'off')}
          </button>
        ))}
      </div>
      {product.showItems && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-2">
            {tr('Choose an item for each spot, left to right. Level 1 is the lowest.')}
          </div>
          {rows}
          {tpl.type === 'open_base' && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex-none text-xs text-gray-500">{tr('Floor')}</span>
              <select
                value={product.baseItem || 'none'}
                onChange={(e) => setBase(e.target.value)}
                className="flex-1 min-w-0 text-xs border border-gray-300 rounded px-1 py-1 bg-white"
              >
                <option value="none">{tr('None')}</option>
                <option value="washer">{tr('Washing machine')}</option>
              </select>
            </div>
          )}
          {washerOut && (
            <div className="text-xs text-amber-700 mb-1.5">
              {tr('The washing machine does not fit. Use a width of 700 or more and raise the lowest level.')}
            </div>
          )}
          <button
            onClick={() => update({ itemPicks: undefined })}
            disabled={!product.itemPicks}
            className={`w-full text-xs py-1.5 rounded border transition ${
              product.itemPicks
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
          >
            {tr('Reset to auto')}
          </button>
        </div>
      )}
    </Section>
  );
}

/* Per-level controls for HOMEDANT HOUSE shelves: drag a slider to move a
   level up or down (it snaps to the post slots) and switch that level
   between basic and basket. Listed top level first, like the shelf.   */
/* Move level i to about `raw` mm: snapped to the slot pitch and kept
   between its neighbours. Returns the new list, or null if unchanged. */
function hhMoveLevel(product, levels, i, raw) {
  const R = levelRule(product);
  const min = i === 0 ? R.min : levels[i - 1].h + R.gap;
  const max = i === levels.length - 1 ? product.height : levels[i + 1].h - R.gap;
  let v = R.min + Math.round((raw - R.min) / R.step) * R.step;
  if (raw >= max - R.step / 2) v = max; // let a level reach its top stop
  v = Math.max(min, Math.min(max, v));
  if (v === levels[i].h) return null;
  return levels.map((l, k) => (k === i ? { ...l, h: v } : l));
}

function HHLevelEditor({ product, tpl, update }) {
  const tiers = product.tier || tpl.defaultTier;
  const levels = hhResolveLevels(product, tiers);
  const custom = levels === product.levels;
  const first = tpl.type === 'open_base' ? 1 : 0; // open base has no bottom board
  const commit = (next) =>
    update({ levels: next, levelsKey: hhLevelKey(product) });
  const setHeight = (i, raw) => {
    const next = hhMoveLevel(product, levels, i, raw);
    if (next) commit(next);
  };
  const toggle = (i) =>
    commit(
      levels.map((l, k) =>
        k === i ? { ...l, style: l.style === 'basket' ? 'basic' : 'basket' } : l
      )
    );
  const rows = [];
  const R = levelRule(product);
  const styled = specOfProduct(product) === HH; // basic / basket is HOMEDANT HOUSE only
  for (let i = levels.length - 1; i >= first; i--) {
    const min = i === 0 ? R.min : levels[i - 1].h + R.gap;
    const max =
      i === levels.length - 1 ? product.height : levels[i + 1].h - R.gap;
    rows.push(
      <div key={i} className="flex items-center gap-2 mb-2">
        <span className="flex-none w-4 text-xs text-gray-500">{i + 1 - first}</span>
        <input
          type="range"
          min={min}
          max={Math.max(min, max)}
          step={1}
          value={levels[i].h}
          disabled={max <= min}
          onChange={(e) => setHeight(i, parseInt(e.target.value, 10))}
          className="flex-1 min-w-0"
        />
        <span className="flex-none w-14 text-right text-xs text-gray-700 tabular-nums">
          {levels[i].h} mm
        </span>
        {styled && <button
          onClick={() => toggle(i)}
          className={`flex-none w-14 text-xs py-1 rounded border transition ${
            levels[i].style === 'basket'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={tr('Switch this level between basic and basket')}
        >
          {tr(levels[i].style)}
        </button>}
      </div>
    );
  }
  return (
    <Section title={tr('Shelf Levels')}>
      <div className="text-xs text-gray-500 mb-2">
        {tr(
          'Height from the post bottom to the top of each level. Level 1 is the lowest.'
        )}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {tr('Tip: drag a board of the selected shelf up or down in the 3D view.')}
      </div>
      {rows}
      <button
        onClick={() => update({ levels: undefined, levelsKey: undefined })}
        disabled={!custom}
        className={`w-full text-xs py-1.5 rounded border transition ${
          custom
            ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            : 'border-gray-200 bg-gray-50 text-gray-400'
        }`}
      >
        {tr('Reset to even spacing')}
      </button>
    </Section>
  );
}

function StaffEditor({ product, update, fixed }) {
  const btn = (on) =>
    `flex-1 text-xs py-1.5 rounded border transition ${
      on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
    }`;
  return (
    <Section title={tr('Staff')}>
      <Field label={tr('Name tag')}>
        <input
          type="text"
          value={product.staffName ?? (fixed ? '이과장' : '')}
          maxLength={12}
          onChange={(e) => update({ staffName: e.target.value })}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
        />
      </Field>
      <Field label={tr('Speech bubble')}>
        <input
          type="text"
          value={product.staffSay ?? 'Hi, how are you?'}
          maxLength={40}
          onChange={(e) => update({ staffSay: e.target.value })}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
        />
      </Field>
      {!fixed && (<>
      <Field label={tr('Glasses')}>
        <div className="flex gap-1.5">
          {[false, true].map((on) => (
            <button key={String(on)} onClick={() => update({ staffGlasses: on })} className={btn(!!product.staffGlasses === on)}>
              {tr(on ? 'on' : 'off')}
            </button>
          ))}
        </div>
      </Field>
      <Field label={tr('Hair')}>
        <div className="flex gap-1.5">
          {['short', 'parted'].map((v) => (
            <button key={v} onClick={() => update({ staffHair: v })} className={btn((product.staffHair || 'short') === v)}>
              {tr(v)}
            </button>
          ))}
        </div>
      </Field>
      <Field label={tr('Shirt')}>
        <div className="flex gap-1.5 flex-wrap">
          {Object.keys(STAFF_SHIRTS).map((v) => (
            <button key={v} onClick={() => update({ staffShirt: v })} className={btn((product.staffShirt || 'navy') === v)}>
              {tr(v)}
            </button>
          ))}
        </div>
      </Field>
      </>)}
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {children}
    </div>
  );
}

function SizeSelect({ label, value, options, onChange }) {
  return (
    <Field label={`${label} (mm)`}>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o} mm · {mmToInch(o)} in
          </option>
        ))}
      </select>
    </Field>
  );
}

function SumCell({ label, mm }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-1.5 text-center">
      <div className="text-xs uppercase text-gray-500 font-medium">{label}</div>
      <div className="text-xs font-semibold text-gray-900">{mm}</div>
      <div className="text-xs text-gray-500">{mmToInch(mm)} in</div>
    </div>
  );
}

function ProductThumb({ type, tpl, product }) {
  // If we can find a registered rendering image, show that instead of SVG.
  // The tpl + product are optional — the left panel passes just `type` for
  // a generic preview, while the property panel passes the full pair.
  if (tpl) {
    const stubProduct = product || {
      width: tpl.defaultSize.width,
      depth: tpl.defaultSize.depth,
      height: tpl.defaultSize.height,
      tier: tpl.defaultTier,
      frameColor: (tpl.frameColors && tpl.frameColors[0]) || 'black',
      boardColor: (tpl.boardColors && tpl.boardColors[0]) || 'wood',
    };
    const img = findRenderImage(stubProduct, tpl);
    if (img && img.url) {
      return (
        <img
          src={img.url}
          alt={tpl.name}
          className="w-7 h-7 flex-none object-contain bg-gray-50 rounded"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
  }

  // tiny SVG thumbnail per type
  const common = 'w-7 h-7 flex-none';
  const stroke = '#444';
  if (type === 'shelf' || type === 'open_base' || type === 'heavy') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <line x1="5" y1="9" x2="19" y2="9" />
        <line x1="5" y1="14" x2="19" y2="14" />
        {type !== 'open_base' && <line x1="5" y1="19" x2="19" y2="19" />}
      </svg>
    );
  }
  if (type === 'garment') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <line x1="6" y1="7" x2="18" y2="7" />
        <line x1="5" y1="19" x2="19" y2="19" />
      </svg>
    );
  }
  if (type === 'rolling') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="16" rx="0.5" />
        <line x1="5" y1="11" x2="19" y2="11" />
        <circle cx="8" cy="21" r="1.3" />
        <circle cx="16" cy="21" r="1.3" />
      </svg>
    );
  }
  if (type === 'staff') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke={stroke} strokeWidth="1.4">
        <circle cx="12" cy="6" r="3.2" />
        <path d="M6 21v-6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6" />
        <rect x="10.5" y="14" width="3" height="2" />
      </svg>
    );
  }
  if (type === 'trolley') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke={stroke} strokeWidth="1.4">
        <rect x="5" y="4" width="14" height="15" rx="0.5" />
        <line x1="5" y1="9" x2="19" y2="9" />
        <line x1="5" y1="14" x2="19" y2="14" />
        <path d="M19 4h2.5" />
        <circle cx="7.5" cy="21" r="1.3" />
        <circle cx="16.5" cy="21" r="1.3" />
      </svg>
    );
  }
  if (type === 'pegboard') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <circle cx="9" cy="7" r="0.6" fill={stroke} />
        <circle cx="12" cy="7" r="0.6" fill={stroke} />
        <circle cx="15" cy="7" r="0.6" fill={stroke} />
        <circle cx="9" cy="11" r="0.6" fill={stroke} />
        <circle cx="12" cy="11" r="0.6" fill={stroke} />
        <circle cx="15" cy="11" r="0.6" fill={stroke} />
        <line x1="5" y1="15" x2="19" y2="15" />
        <line x1="5" y1="19" x2="19" y2="19" />
      </svg>
    );
  }
  if (type === 'drawer' || type === 'cabinet') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <line x1="5" y1="9" x2="19" y2="9" />
        <rect x="6.5" y="11" width="11" height="3" rx="0.3" />
        <rect x="6.5" y="15.5" width="11" height="3" rx="0.3" />
      </svg>
    );
  }
  if (type === 'frame_open') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <circle cx="12" cy="14" r="3" />
      </svg>
    );
  }
  if (type === 'banner') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="8" y="2" width="8" height="18" rx="0.5" />
        <line x1="6" y1="21" x2="18" y2="21" />
      </svg>
    );
  }
  if (type === 'poster') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="4" width="14" height="14" rx="0.5" />
        <line x1="5" y1="22" x2="5" y2="18" />
        <line x1="19" y1="22" x2="19" y2="18" />
      </svg>
    );
  }
  if (type === 'table' || type === 'logo_table') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="6" y1="10" x2="6" y2="20" />
        <line x1="18" y1="10" x2="18" y2="20" />
      </svg>
    );
  }
  if (type === 'chair') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <line x1="7" y1="4" x2="7" y2="20" />
        <line x1="7" y1="13" x2="17" y2="13" />
        <line x1="17" y1="13" x2="17" y2="20" />
      </svg>
    );
  }
  if (type === 'catalog') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <line x1="12" y1="3" x2="12" y2="20" />
        <line x1="6" y1="20" x2="18" y2="20" />
        <path d="M7 9 l5 -2 l5 2" />
        <path d="M7 13 l5 -2 l5 2" />
      </svg>
    );
  }
  if (type === 'tv') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="3" y="4" width="18" height="11" rx="0.8" />
        <line x1="12" y1="15" x2="12" y2="20" />
        <line x1="8" y1="20" x2="16" y2="20" />
      </svg>
    );
  }
  return <div className={common} />;
}

/* ============================================================
   ORBIT CONTROLS  ── minimal in-house implementation
   ============================================================ */
function createOrbitControls(camera, dom) {
  const target = new THREE.Vector3(0, 1, 0);
  const spherical = new THREE.Spherical();
  const offset = camera.position.clone().sub(target);
  spherical.setFromVector3(offset);
  let mode = null; // 'rotate' | 'pan'
  let lastX = 0,
    lastY = 0;
  const ctrl = {
    target,
    enabled: true,
    minDistance: 1,
    maxDistance: 80,
    minPolarAngle: 0.05,
    maxPolarAngle: Math.PI / 2 - 0.02,
    update() {
      const off = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(target).add(off);
      camera.lookAt(target);
    },
    setView(mode, dist, angles) {
      const r = dist || spherical.radius;
      if (angles) {
        spherical.set(r, angles.phi, angles.theta);
      } else if (mode === 'top') {
        spherical.set(r, 0.05, 0);
      } else if (mode === 'front') {
        spherical.set(r, Math.PI / 2 - 0.1, 0);
      } else {
        spherical.set(r, Math.PI / 3.5, Math.PI / 4);
      }
      ctrl.update();
    },
    dispose() {
      dom.removeEventListener('mousedown', onDown);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onCtx);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    },
  };

  function onDown(e) {
    if (!ctrl.enabled) return;
    if (e.button === 0) mode = 'rotate';
    else if (e.button === 2) mode = 'pan';
    else return;
    lastX = e.clientX;
    lastY = e.clientY;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
  function onMove(e) {
    if (!ctrl.enabled || !mode) return;
    const dx = e.clientX - lastX,
      dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (mode === 'rotate') {
      const rect = dom.getBoundingClientRect();
      spherical.theta -= (dx / rect.width) * Math.PI * 2;
      spherical.phi -= (dy / rect.height) * Math.PI;
      spherical.phi = Math.max(
        ctrl.minPolarAngle,
        Math.min(ctrl.maxPolarAngle, spherical.phi)
      );
    } else {
      const factor = spherical.radius * 0.0018;
      const right = new THREE.Vector3(
        Math.cos(spherical.theta),
        0,
        -Math.sin(spherical.theta)
      ).multiplyScalar(-dx * factor);
      const fwd = new THREE.Vector3(
        Math.sin(spherical.theta),
        0,
        Math.cos(spherical.theta)
      ).multiplyScalar(dy * factor);
      target.add(right).add(fwd);
    }
    ctrl.update();
  }
  function onUp() {
    mode = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }
  function onWheel(e) {
    if (!ctrl.enabled) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    spherical.radius = Math.max(
      ctrl.minDistance,
      Math.min(ctrl.maxDistance, spherical.radius * factor)
    );
    ctrl.update();
  }
  function onCtx(e) {
    e.preventDefault();
  }

  dom.addEventListener('mousedown', onDown);
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('contextmenu', onCtx);
  ctrl.update();
  return ctrl;
}

/* ============================================================
   DISPOSE HELPERS
   ============================================================ */
function disposeGroup(g) {
  g.traverse((c) => {
    if (c.userData && c.userData.sharedAsset) return; // cached prop model
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material.dispose();
    }
  });
}
