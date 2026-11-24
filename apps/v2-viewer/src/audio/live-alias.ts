const unsafe = /(?:https?|www|gmail|tiktok|zalo|password|mật khẩu|số điện thoại|địa chỉ|địt|đụ|lồn|fuck|shit|bitch)/iu;

export function spokenAlias(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 48) return;
  const alias = value.normalize('NFC').trim().replace(/ +/g, ' ');
  // Keep a short Latin-script spoken alias. Handles, digits, emoji and other scripts use generic thanks.
  if (alias.length < 2 || alias.length > 24 || unsafe.test(alias) ||
      !/^(?:\p{Script=Latin}[\p{Script=Latin}\p{M}]*)(?:[ '-]\p{Script=Latin}[\p{Script=Latin}\p{M}]*){0,3}$/u.test(alias)) return;
  if (!/[aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/iu.test(alias)) return;
  return alias;
}

export type LiveVoiceIdentity = Readonly<{
  seq: number; roomEpoch: number; connection: number; alias: string; count: number;
}>;