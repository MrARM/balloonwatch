// Responses from GET https://api.v2.sondehub.org/predictions

import ascJson from './SondeHubHTTP/U0370390_Ascending.json' assert { type: "json" };
import descJson from './SondeHubHTTP/U0510901_Descending.json' assert { type: "json" };
export default {
    ascending: ascJson,
    descending: descJson,
    invalid: []
};
