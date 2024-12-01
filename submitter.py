import os

import click
from blockfrost import ApiUrls
from dotenv import load_dotenv
from pycardano import (  # type: ignore
    Address,
    BlockFrostChainContext,
    TransactionBuilder,
    TransactionOutput,
    VerificationKeyHash,
    PlutusData,
    PlutusV2Script,
    plutus_script_hash,
    Value,
    Network,
)
from rich import print

from keys import get_address, get_signing_info
from validator import ReactionDatum

load_dotenv()


@click.command()
@click.argument("name")
@click.argument("drep")
@click.argument("proposal")
@click.argument("support")
def main(name: str, drep: str, proposal: str, support: str):
    # Load chain context
    context = BlockFrostChainContext(
        project_id=os.getenv("BLOCKFROST_PROJECT_ID"),
        base_url=ApiUrls.preview.value
    )

    # Get payment address
    payment_address = get_address(name)

    # Get the beneficiary VerificationKeyHash (PubKeyHash)
    beneficiary_address = get_address(name)
    vkey_hash: VerificationKeyHash = beneficiary_address.payment_part

    # Create the vesting datum
    params = ReactionDatum(
        delegator=bytes(vkey_hash),
        drep=drep.encode(),
        proposal=proposal.encode(),
        support=support.encode(),
    )

    # Load script info
    with open('assets/script.cbor') as f:
        cbor_hex = f.read()
        cbor = bytes.fromhex(cbor_hex)
        plutus_script = PlutusV2Script(cbor)
        script_hash = plutus_script_hash(plutus_script)
        script_address = Address(script_hash, network=Network.TESTNET)

    # Make datum
    datum = params

    # Build the transaction
    builder = TransactionBuilder(context)
    builder.add_input_address(payment_address)
    builder.add_output(
        TransactionOutput(address=script_address, amount=Value(2_000_000), datum=datum)
    )

    # Sign the transaction
    payment_vkey, payment_skey, payment_address = get_signing_info(name)
    signed_tx = builder.build_and_sign(
        signing_keys=[payment_skey],
        change_address=payment_address,
    )

    # Submit the transaction
    context.submit_tx(signed_tx)

    print(f"transaction id: {signed_tx.id}")
    print(f"Cardanoscan: https://preview.cexplorer.io/tx/{signed_tx.id}")


if __name__ == "__main__":
    main()
