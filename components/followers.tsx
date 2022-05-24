interface Props {
	followers: any[]
}

const Followers = ({ followers }: Props) => {
	console.log(followers)
	return (
		<div>
			{followers.map(value => (
				<div>
					{value.wallet.defaultProfile.handle}
				</div>
			))}
		</div>
	)
}

export default Followers