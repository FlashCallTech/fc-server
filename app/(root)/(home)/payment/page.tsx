import Payment from '@/components/client/payment'
import Withdraw from '@/components/creator/Withdraw'

const page = () => {
	let role = 'creator'
	return (
		<>
		{role !== 'creator'? (<Payment />):(<Withdraw />) }
		</>
	)
}

export default page
