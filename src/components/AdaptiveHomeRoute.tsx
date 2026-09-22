import DashboardPage from '../pages/DashboardPage'
import SimpleHomePage from '../pages/SimpleHomePage'
import {
  getProfile,
} from '../profile/userProfile'

function AdaptiveHomeRoute() {
  const profile = getProfile()

  if (
    profile.homeExperience === 'simple'
  ) {
    return <SimpleHomePage />
  }

  return <DashboardPage />
}

export default AdaptiveHomeRoute
