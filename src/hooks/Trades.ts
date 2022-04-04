import { Currency, CurrencyAmount, Pair, UniswapV2RoutablePlatform, Token, UniswapV2Trade, Percent } from '@swapr/sdk'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'
import { BASES_TO_CHECK_TRADES_AGAINST } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useIsMultihop } from '../state/user/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { useActiveWeb3React } from './index'

/**
 * Returns all commons Uniswap V2 pairs between two gives tokens
 * @param currencyA First currency
 * @param currencyB Second currency
 * @param platform Uniswap V2 platform
 * @returns List of pairs
 */
function useAllCommonUniswapV2Pairs(
  currencyA?: Currency,
  currencyB?: Currency,
  platform: UniswapV2RoutablePlatform = UniswapV2RoutablePlatform.SWAPR
): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = useMemo(() => (chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []), [chainId])

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
    [bases]
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            // token B against all bases
            ...bases.map((base): [Token, Token] => [tokenB, base]),
            // each base against all bases
            ...basePairs
          ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
        : [],
    [tokenA, tokenB, bases, basePairs]
  )

  const allPairs = usePairs(allPairCombinations, platform)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

/**
 * Returns list of trade route for the exact amount of tokens in to the given token out
 * @param currencyAmountIn Amount of tokens in
 * @param currencyOut Token out
 * @param platform Uniswap V2 platform
 * @returns Trade routes
 */
export function useTradeExactInUniswapV2(
  currencyAmountIn?: CurrencyAmount,
  currencyOut?: Currency,
  platform: UniswapV2RoutablePlatform = UniswapV2RoutablePlatform.SWAPR
): UniswapV2Trade[] {
  const { chainId } = useActiveWeb3React()
  const allowedPairs = useAllCommonUniswapV2Pairs(currencyAmountIn?.currency, currencyOut, platform)
  const multihop = useIsMultihop()

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0 && chainId && platform.supportsChain(chainId)) {
      return UniswapV2Trade.computeTradeExactIn({
        currencyAmountIn,
        currencyOut,
        maximumSlippage: new Percent('3', '100'),
        pairs: allowedPairs,
        maxHops: {
          maxHops: multihop ? 3 : 1,
          maxNumResults: 1
        }
      })
    }
    return []
  }, [currencyAmountIn, currencyOut, allowedPairs, chainId, platform, multihop])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 * @param currencyIn Token in
 * @param currencyAmountOut Amount of tokens out
 * @param platform Uniswap V2 platform
 * @returns Trade routes
 */
export function useTradeExactOutUniswapV2(
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount,
  platform: UniswapV2RoutablePlatform = UniswapV2RoutablePlatform.SWAPR
): UniswapV2Trade[] {
  const { chainId } = useActiveWeb3React()
  const allowedPairs = useAllCommonUniswapV2Pairs(currencyIn, currencyAmountOut?.currency, platform)
  const multihop = useIsMultihop()

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0 && chainId && platform.supportsChain(chainId)) {
      return UniswapV2Trade.computeTradeExactOut({
        currencyIn,
        currencyAmountOut,
        maximumSlippage: new Percent('3', '100'),
        pairs: allowedPairs,
        maxHops: {
          maxHops: multihop ? 3 : 1,
          maxNumResults: 1
        }
      })
    }
    return []
  }, [currencyIn, currencyAmountOut, allowedPairs, chainId, platform, multihop])
}
