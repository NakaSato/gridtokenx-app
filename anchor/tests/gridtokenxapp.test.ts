import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchGridtokenxapp,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('gridtokenxapp', () => {
  let payer: KeyPairSigner
  let gridtokenxapp: KeyPairSigner

  beforeAll(async () => {
    gridtokenxapp = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Gridtokenxapp', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, gridtokenxapp: gridtokenxapp })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentGridtokenxapp = await fetchGridtokenxapp(rpc, gridtokenxapp.address)
    expect(currentGridtokenxapp.data.count).toEqual(0)
  })

  it('Increment Gridtokenxapp', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({
      gridtokenxapp: gridtokenxapp.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchGridtokenxapp(rpc, gridtokenxapp.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Increment Gridtokenxapp Again', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({ gridtokenxapp: gridtokenxapp.address })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchGridtokenxapp(rpc, gridtokenxapp.address)
    expect(currentCount.data.count).toEqual(2)
  })

  it('Decrement Gridtokenxapp', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getDecrementInstruction({
      gridtokenxapp: gridtokenxapp.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchGridtokenxapp(rpc, gridtokenxapp.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Set gridtokenxapp value', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getSetInstruction({ gridtokenxapp: gridtokenxapp.address, value: 42 })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchGridtokenxapp(rpc, gridtokenxapp.address)
    expect(currentCount.data.count).toEqual(42)
  })

  it('Set close the gridtokenxapp account', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getCloseInstruction({
      payer: payer,
      gridtokenxapp: gridtokenxapp.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    try {
      await fetchGridtokenxapp(rpc, gridtokenxapp.address)
    } catch (e) {
      if (!isSolanaError(e)) {
        throw new Error(`Unexpected error: ${e}`)
      }
      expect(e.message).toEqual(`Account not found at address: ${gridtokenxapp.address}`)
    }
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
