import { describe, expect, test } from 'bun:test';

import { getFileSize } from './utils';

describe('getFileSize', () => {
  describe('bytes', () => {
    test('should return bytes for sizes less than 1024', () => {
      expect(getFileSize(0)).toBe('0 B');
      expect(getFileSize(1)).toBe('1 B');
      expect(getFileSize(512)).toBe('512 B');
      expect(getFileSize(1023)).toBe('1023 B');
    });
  });

  describe('kilobytes', () => {
    test('should return KB for sizes between 1024 and 1MB', () => {
      expect(getFileSize(1024)).toBe('1.0 KB');
      expect(getFileSize(1536)).toBe('1.5 KB');
      expect(getFileSize(2048)).toBe('2.0 KB');
      expect(getFileSize(1048575)).toBe('1024.0 KB'); // 1MB - 1 byte
    });

    test('should round KB to 1 decimal place', () => {
      expect(getFileSize(1126)).toBe('1.1 KB'); // 1126 / 1024 = 1.099...
      expect(getFileSize(1229)).toBe('1.2 KB'); // 1229 / 1024 = 1.200...
    });
  });

  describe('megabytes', () => {
    test('should return MB for sizes 1MB and above', () => {
      expect(getFileSize(1048576)).toBe('1.00 MB'); // Exactly 1MB
      expect(getFileSize(2097152)).toBe('2.00 MB'); // Exactly 2MB
      expect(getFileSize(5242880)).toBe('5.00 MB'); // Exactly 5MB
    });

    test('should round MB to 2 decimal places', () => {
      expect(getFileSize(1572864)).toBe('1.50 MB'); // 1.5MB
      expect(getFileSize(1258291)).toBe('1.20 MB'); // ~1.2MB
      expect(getFileSize(1073741824)).toBe('1024.00 MB'); // 1GB in MB
    });
  });

  describe('edge cases', () => {
    test('should handle boundary values correctly', () => {
      expect(getFileSize(1023)).toBe('1023 B');
      expect(getFileSize(1024)).toBe('1.0 KB');
      expect(getFileSize(1048575)).toBe('1024.0 KB');
      expect(getFileSize(1048576)).toBe('1.00 MB');
    });

    test('should handle decimal inputs', () => {
      expect(getFileSize(1024.5)).toBe('1.0 KB');
      expect(getFileSize(1048576.7)).toBe('1.00 MB');
    });
  });
});
