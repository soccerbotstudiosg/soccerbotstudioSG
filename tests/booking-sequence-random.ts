/** Replay the first OS-drawn seeds with xorshift32. The result is an index into the available actions. */
export function bookingSequenceRandom(seed: number) {
  let state = seed >>> 0;
  if (!state) throw new Error("The sequence seed must be nonzero");
  return (choices: number) => {
    if (!Number.isSafeInteger(choices) || choices < 1)
      throw new Error("A sequence needs at least one available action");
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return Math.floor(((state >>> 0) / 0x100000000) * choices);
  };
}

/** Replay one of the 18 optional component rounds without changing a test's deadline. */
export function bookingSequenceSeed(scenario: number, original: number) {
  const round = Number(process.env.BOOKING_SEQUENCE_ROUND ?? 0);
  if (!Number.isInteger(round) || round < 0 || round > 18)
    throw new Error("BOOKING_SEQUENCE_ROUND must be between 0 and 18");
  if (!round) return original;
  const next = bookingSequenceRandom(2556561575);
  const offset = (round - 1) * 5 + scenario - 6;
  for (let index = 0; index < offset; index++) next(0xffffffff);
  return 1 + next(0xffffffff);
}
