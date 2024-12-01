import shelve

from flask import Flask, request, jsonify
from flask_cors import CORS  # type: ignore
from requests import HTTPError

from crypto import raw_to_bech32
from governance_client import BlockfrostGovernanceAPI
import submitter

proposal_data_cache = None
treasury_epoch_map = None

api = BlockfrostGovernanceAPI()

app = Flask(__name__)
CORS(app)


@app.route("/treasury_epochs")
def treasury_epochs():
    epoch_data = api.epoch_latest()
    print(epoch_data.epoch, last_epoch)
    if epoch_data.epoch != last_epoch:
        network_data = api.network()
        print(treasury_epoch_map)
        epoch_treasury = network_data.supply.treasury
        treasury_epoch_map[epoch_data.epoch] = epoch_treasury
        print(f"new epoch: {epoch_data.epoch} treasury: {epoch_treasury}")
        print(treasury_epoch_map)
    return jsonify(treasury_epoch_map)


@app.route("/treasury_proposals")
def get_treasury_proposals():
    results = []
    proposals = api.get_all_proposals()
    treasury_proposals = [p for p in proposals if p['governance_type'] == 'treasury_withdrawals']
    for proposal in treasury_proposals:
        tx_hash, cert_index = proposal['tx_hash'], proposal['cert_index']
        if (tx_hash, cert_index) in proposal_data_cache:
            results.append(proposal_data_cache[(tx_hash, cert_index)])
            continue
        print((tx_hash, cert_index), "not cached! fetching...")
        proposal_target = api.get_proposal_withdrawals(tx_hash, cert_index)
        try:
            proposal_metadata = api.get_proposal_metadata(tx_hash, cert_index)
        except HTTPError as e:
            proposal_metadata = {"json_metadata": {}}
        proposal_votes = api.get_proposal_votes(tx_hash, cert_index)
        results.append(
            {
                "proposal": proposal,
                "proposal_target": proposal_target,
                "proposal_metadata": proposal_metadata["json_metadata"],
                "proposal_votes": [
                    {
                        "voter": vote["voter"],
                        "vote": vote["vote"],
                        "voter_role": vote["voter_role"]
                    }
                    for vote in proposal_votes
                ]
            }
        )
        proposal_data_cache[(tx_hash, cert_index)] = results[-1]
    return jsonify(results)


@app.route("/user_address", methods=["POST"])
def user_address():
    raw_stake_key = request.json.get("address")
    stake_key = raw_to_bech32(raw_stake_key)
    user_data = db.get("known_addresses", {})
    print(user_data)
    #if not user_data or stake_key not in user_data:
    if 1:
        #address_data = api.address_extended(address)
        #stake_key = address_data.stake_address
        print(stake_key)
        stake_data = api.accounts(stake_key)
        user_data = {
            #"address": address,
            "stake_key": stake_key,
            "drep_id": stake_data.drep_id,
        }
        known_addresses[stake_key] = user_data
    return jsonify(known_addresses[stake_key])


@app.route("/drep_votes", methods=["POST"])
def drep_votes():
    drep_id = request.json.get("drep_id")
    votes = api.get_all_drep_votes(drep_id)
    vote_data = []
    for vote in votes:
        tx_hash, cert_index = vote['tx_hash'], vote['cert_index']
        proposal = proposal_data_cache.get((tx_hash, cert_index))
        if not proposal:
            print(f" proposal data for {vote['tx_hash']}:{vote['cert_index']} not found :(")
            continue
        vote_data.append(
            {
                "proposal": proposal,
                "vote": vote["vote"],
                "vote_id": f"{tx_hash}:{cert_index}",
            }
        )
    return jsonify(vote_data)


@app.route("/submit_reaction", methods=["POST"])
def submit_reaction():
    stake_key = request.json.get("stake_key")
    drep_id = request.json.get("drep_id")
    proposal = request.json.get("proposal")
    support = request.json.get("support")
    reaction = submitter.main(stake_key, drep_id, proposal, support)
    return jsonify({"result": "success", "reaction": reaction})


if __name__ == "__main__":
    with shelve.open('db') as db:
        treasury_epoch_map = db.get("treasury_epoch_map", {})
        # simulate some epochs
        treasury_epoch_map[765] = "4729264376012653"
        treasury_epoch_map[766] = "4729264375012653"
        treasury_epoch_map[767] = "4729264378012653"
        known_addresses = db.get("known_addresses", {})
        proposal_data_cache = db.get("proposal_data", {})
        last_epoch = db.get("last_epoch", -1)
        print(
            f"loaded:\n"
            f"epochs: {db['treasury_epoch_map']}\n"
            f"addresses: {db['known_addresses']}\n"
            f"proposals: {len(db['proposal_data'])} proposals"
        )
        try:
            app.run(host='0.0.0.0', port=5000)
        finally:
            db["treasury_epoch_map"] = treasury_epoch_map
            db["known_addresses"] = known_addresses
            db["proposal_data"] = proposal_data_cache
            print(
                f"saved:\n"
                f"epochs: {db['treasury_epoch_map']}\n"
                f"addresses: {db['known_addresses']}\n"
                f"proposals: {[k for k in db['proposal_data']]}"
            )
