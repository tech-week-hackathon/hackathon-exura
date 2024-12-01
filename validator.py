from dataclasses import dataclass

from opshin.prelude import *
from opshin.ledger.interval import *


@dataclass
class ReactionDatum(PlutusData):
    CONSTR_ID = 0
    delegator: PubKeyHash
    drep: bytes
    proposal: bytes
    support: bytes


# opshin validator
def validator(datum: ReactionDatum, redeemer: None, context: ScriptContext) -> None:
    assert isinstance(datum, ReactionDatum)
    signed = False
    for s in context.tx_info.signatories:
        if datum.delegator == s:
            signed = True
    assert signed, "Only claimable by delegator!"
