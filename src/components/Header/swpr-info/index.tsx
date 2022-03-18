import { TokenAmount } from '@swapr/sdk'
import React, { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../../hooks'
import { Amount } from '../index'

const StakeIndicator = styled.div`
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, #2e17f2 -24.77%, #fb52a1 186.93%);
  border-radius: 0px 8px 8px 0px;
  padding: 6px 12px;
  font-weight: bold;
  font-size: 10px;
  line-height: 10px;
  cursor: pointer;
`
const Wrapper = styled.div<{ hide: boolean }>`
  display: flex;
  margin-right: 7px;
  border-radius: 15px 50px 30px 5px;
  visibility: ${({ hide }) => (hide ? 'hidden' : 'visible')};
`

interface SwprInfoProps {
  newSwprBalance?: TokenAmount
  onToggleClaimPopup: () => void
  hasActiveCampaigns: boolean
}

export function SwprInfo({ onToggleClaimPopup, newSwprBalance, hasActiveCampaigns }: SwprInfoProps) {
  const { account } = useActiveWeb3React()
  // Cache the previous value
  const [isLoading, setIsLoading] = useState(true)
  const [swprBalance, setSwprBalance] = useState<TokenAmount | undefined>(newSwprBalance)

  useEffect(() => {
    console.log({ newSwprBalance })
    // Update local value if the new property is updated
    if (newSwprBalance && !swprBalance?.equalTo(newSwprBalance)) {
      setIsLoading(false)
      setSwprBalance(newSwprBalance)
      return
    }
    // eslint-disable-next-line
  }, [newSwprBalance?.toFixed(3)])

  return (
    <Wrapper onClick={onToggleClaimPopup} hide={!account}>
      <Amount borderRadius={hasActiveCampaigns ? '8px 0px 0px 8px !important;' : ''} zero={false} clickable>
        {isLoading ? (
          <Skeleton width="37px" style={{ marginRight: '3px' }} />
        ) : account && swprBalance ? (
          swprBalance?.toFixed(3)
        ) : (
          '0.000'
        )}{' '}
        SWPR
      </Amount>
      {hasActiveCampaigns && <StakeIndicator>STAKE</StakeIndicator>}
    </Wrapper>
  )
}
