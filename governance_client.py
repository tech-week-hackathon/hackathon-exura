import os

import requests
from blockfrost import BlockFrostApi, ApiError, ApiUrls  # type: ignore
from dotenv import load_dotenv
from rich import print

load_dotenv()


class BlockfrostGovernanceAPI(BlockFrostApi):

    _session: requests.Session

    def __init__(self):
        self._session = requests.Session()
        project_id = os.getenv("BLOCKFROST_PROJECT_ID")
        base_url = ApiUrls.preview.value
        self.BASE_URL = base_url + '/v0'  # Preview API version
        self.headers = {
            "project_id": project_id,
            "Accept": "application/json",
        }
        super().__init__(project_id=project_id, base_url=base_url)

    def _make_request(self, endpoint: str, params=None):
        url = f"{self.BASE_URL}/{endpoint}"
        print(f"request to: {url=} with params: {params=}")
        response = self._session.get(url, headers=self.headers, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        try:
            return response.json()
        except Exception as e:
            print(response.text)
            return None

    def _fetch_all_pages(self, endpoint: str, params=None):
        params = params or {}
        params.setdefault("page", 1)
        params.setdefault("count", 100)
        all_items = []
        while True:
            data = self._make_request(endpoint, params=params)
            if not data:
                break
            all_items.extend(data)
            params["page"] += 1
        return all_items

    # Governance Endpoints with All Pages Support

    def get_all_dreps(self):
        return self._fetch_all_pages("governance/dreps")

    def get_all_drep_delegators(self, drep_id: str):
        return self._fetch_all_pages(f"governance/dreps/{drep_id}/delegators")

    def get_all_drep_updates(self, drep_id: str):
        return self._fetch_all_pages(f"governance/dreps/{drep_id}/updates")

    def get_all_drep_votes(self, drep_id: str):
        return self._fetch_all_pages(f"governance/dreps/{drep_id}/votes")

    def get_all_proposals(self):
        return self._fetch_all_pages("governance/proposals")

    def get_all_proposal_votes(self, tx_hash: str, cert_index: int):
        return self._fetch_all_pages(f"governance/proposals/{tx_hash}/{cert_index}/votes")

    # Single-Page Governance Endpoints

    def get_drep_by_id(self, drep_id: str):
        return self._make_request(f"governance/dreps/{drep_id}")

    def get_drep_metadata(self, drep_id: str):
        return self._make_request(f"governance/dreps/{drep_id}/metadata")

    def get_proposal_by_id(self, tx_hash: str, cert_index: int):
        return self._make_request(f"governance/proposals/{tx_hash}/{cert_index}")

    def get_proposal_parameters(self, tx_hash: str, cert_index: int):
        return self._make_request(f"governance/proposals/{tx_hash}/{cert_index}/parameters")

    def get_proposal_withdrawals(self, tx_hash: str, cert_index: int):
        return self._make_request(f"governance/proposals/{tx_hash}/{cert_index}/withdrawals")

    def get_proposal_metadata(self, tx_hash: str, cert_index: int):
        return self._make_request(f"governance/proposals/{tx_hash}/{cert_index}/metadata")

    def get_proposal_votes(self, tx_hash: str, cert_index: int):
        return self._make_request(f"governance/proposals/{tx_hash}/{cert_index}/votes")
