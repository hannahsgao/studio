import { SiteHeader } from "../../site-header";

export const metadata = {
  title: "new frontiers — hannah gao ✶",
  description: "New Frontiers, an essay by Hannah Gao.",
};

export default function NewFrontiersPage() {
  return (
    <>
      <SiteHeader currentPage="blog" />
      <main className="blog-page">
        <article className="blog-content">
          <header className="blog-header">
            <h1 className="blog-title">new frontiers</h1>
            <p className="blog-dek">
              my notes-app musings on the next few years
            </p>
            <p className="blog-subtitle">
              <time dateTime="2026-06-23">06.23.2026</time>
            </p>
          </header>

          <div className="blog-copy">
            <p>
              Many undercurrents and overcurrents have pushed AI from niche
              research circles to the hot seat of global politics: within the
              labs, and increasingly so the government, it is well-understood
              that this is no longer just technology or even industry, but a
              question of national power — and one we may have no choice but to
              pursue quickly. And yet, outside of these rooms, people encounter
              the same “miracle” technology as unemployment or AI slop reels,
              all while being asked to accept the inevitability of it all. A
              big, ugly, windowless colossus of a building is coming to your
              backyard. It will ruin your view, raise your utility bills, and
              eventually take your job.
            </p>

            <p>
              There is a distinct and noticeable gap between the promised grand
              AGI future that we are supposedly building and the state of the
              world today — generative AI pretty much only has PMF in search,
              code, and making images. Everything else is a joke.
            </p>

            <p>
              This is not shocking information, and I think most techies would
              also agree that this is the case. What concerns me, then, is what
              to make of it? What does it mean when the most transformative
              technology of our time is charted to usher in an age of abundance
              and simultaneously struggles to find use cases beyond better
              Google or doomscrollable slop?
            </p>

            <p>
              And if even the people at the epicenter are hazy at best about the
              elephant in the room, how do we expect the rest of the country to
              feel?
            </p>

            <p>
              It’s no surprise, then, that anti-AI sentiment is becoming largely
              bipartisan, polling more negatively than ICE (but still above
              Iran!). This presents a huge issue when the public interest is in
              conflict with the national interest, and the government “by the
              people, for the people” is in a divergent reality from its people.
              And yet, from America’s AI Action Plan 2025, we gotta “Build, Baby,
              Build!”
            </p>

            <p>
              There is some general awareness that public sentiment around AI is
              negative, and I often hear the following takes:
            </p>

            <ul className="blog-list" role="list">
              <li>
                Most people are Luddites, and their opinions don’t matter
                because they are uneducated chuds.
              </li>
              <li>
                Their opinions matter, but will change if we make the product
                really good.
              </li>
            </ul>

            <p>
              Both of these require that time be on our side, and I’m not sure
              that it is. The sheer magnitude of just how much people hate AI
              seems to be grossly underestimated, and there is a pretty obvious
              reckoning approaching.
            </p>

            <p>
              For illustrative purposes, suppose you are candidate Douggy
              McDougface and you’re running for president in the 2028 election.
              You don’t need to be technical to notice that being anti-AI polls
              well. People are angry and scared: about data centers in their
              backyard, about their brain-rotted borderline-illiterate kids,
              about the tech oligarchy. And, even better for you, this holds
              across party lines. So you do the publicly rational thing: No more
              data centers eating up our power and guzzling our water. Protect
              American jobs. Stop Silicon Valley from running the country.
            </p>

            <p>Then you win.</p>

            <p>
              Unfortunately, sometime between [insert your town] and the Oval
              Office, you have been made acutely aware that AI is becoming a
              question of national power; that China is not going to stop
              building because Americans find data centers ugly; that the
              intelligence sitting inside a handful of American companies may
              be one of the most strategically important assets of the century.
            </p>

            <p>So now Douggy McDougface has a problem.</p>

            <p>
              You can imagine where this starts to go: maybe Douggy slams Sam
              and Dario on Twitter and then slides into the DMs asking what they
              need to build another ten gigawatts. Maybe the public notices, and
              maybe they get angrier. Maybe the political response is then to
              regulate, restrict, or even nationalize the labs — which, from
              Douggy’s perspective, conveniently resolves both problems at once:
              the state gets control of an increasingly strategic resource, and
              he gets to say he finally put Silicon Valley in its place.
            </p>

            <p>
              It’s unclear how any of this actually goes (and thanks for
              humoring me), but the point is that, the way things are going,
              Democratic incentives increasingly reward politicians for
              opposing AI at exactly the same time that geopolitical incentives
              reward governments for accelerating it. In such a way, the labs
              could win Washington and still lose the country.
            </p>

            <p>
              The problem is that much of the negative effects of AI are
              measured in months/years, and the positive ones in decades. As
              such, public opinion is existential: I fear a future in which we
              absorb the immediate costs (job displacement, civil unrest) and
              prevent ourselves from reaching the future that might justify
              them (scientific discovery, abundance, robotics, etc.). The good
              future is won by turning bits into atoms: factories, labs, grids,
              hospitals, logistics, defense. But a buildout of that scale
              requires public consent measured in decades, which we have not put
              nearly enough effort into earning.
            </p>

            <p>The most pressing bottleneck for AI is legitimacy.</p>

            <p>
              It’s not that frontier labs are irrational or malicious; I feel
              extraordinarily lucky to work with some of the kindest, smartest,
              and most thoughtful people I have ever met. It is that the
              rational action for each actor on a macro scale leads to net worse
              outcomes. Labs receive the symbolic status of national
              instruments, but the incentives of privatized labs are inherently
              misaligned with “AI for good.” The billions in spending must
              eventually be justified by revenue, and the shortest path to
              revenue runs through enterprises. The easiest product to sell is
              one that reduces labor costs. By contrast, curing neglected
              diseases, improving public schools, modernizing infrastructure,
              and accelerating basic science produce benefits that are diffuse,
              difficult to price, and slow to arrive.
            </p>

            <p>
              There is a sense of hopelessness and deep societal mistrust that
              seems to be the overtone of my generation, and it is both
              incredibly saddening and concerning to me that AI is shaping up
              to be the flagship issue at which we direct this sentiment. Too
              much nationalism isn’t a good thing, but too little is how nations
              fall, especially in such a critical era of new technology.
            </p>

            <p>
              But what does this look like? To me, some form of nationalization
              seems inevitable. My hope is that we can kill two birds with one
              stone, in that not only would the incentives be shifted to
              actually useful research instead of enterprise sales, but it
              would also give America a reason to dream.
            </p>

            <p>
              The federal government has the capital, time horizon, and
              authority to make abundance a primary objective. The model of the
              government setting a mission, funding research, and then becoming
              a large customer has been one historical way of promoting healthy
              competition, and helped produce the space program, the internet,
              modern semiconductors, and much of biotech.
            </p>

            <p>
              AI needs a similar contract directed toward a clear set of
              unmistakably national goals, be it drug discovery, education,
              manufacturing, energy, etc.
            </p>

            <p>
              As an aside, this would be more aligned with the long-term
              outcomes of frontier labs anyways. There comes a certain point
              where more intelligence yields diminishing returns: the difference
              in output from a 130 IQ person vs. a 150 IQ person when filing
              taxes is negligible. The difference between a very smart
              physicist and Feynman is historic. The primary focus of the labs
              is for frontier intelligence, which much more aligns in the long
              term with goals like discovering new drugs, understanding the
              human body, and decoding the universe much more than it does
              enterprise SaaS. And yet, the incentives that be have forced us
              into some backward race.
            </p>

            <p>
              As an observation, the sentiment in China seems much more
              optimistic and accepting of AI. Automation is less of a concern
              when there is reason to believe that the state will secure your
              livelihood. It helps, too, to watch skylines transform from straw
              villages to skyscrapers in one lifetime. There is reason to
              believe.
            </p>

            <p>
              The United States, on the other hand, provides no such assurance
              for its people. Whether or not massive labor displacement actually
              occurs (which I don’t think it will), the sentiment is real, and
              it is pressing. Our country needs a reason to believe in not only
              the government, but a collectively brighter future.
            </p>

            <p>
              This is not a task solvable by branding exercises or traditional
              marketing. Aesthetically vague Codex billboards or influencer
              campaigns serve enterprise and consumer purposes, but this is
              categorically different from what it takes to build a compelling
              cultural vision of AI.
            </p>

            <p>
              Like it or not, OpenAI/ChatGPT is far and wide synonymous to AI.
              With great power comes great responsibility, and we have both
              reason and duty to care — it is our responsibility to enable
              people to understand, imagine, and hope for the incredible
              technology and the future that we represent.
            </p>

            <p>
              Though real, durable optimism will come with the tangible benefits
              of the technology, there is much to be done culturally in the
              meantime. This is what I had hoped would come out of Patrick
              Collison’s new aesthetics grant, or A24’s AI lab, both of which
              were exciting steps in the right direction, yet neither have been
              able to create a compelling vision. I have many more thoughts as
              to why (deterioration of centralized media, the delocalization of
              aesthetics, the spirit of art in general, etc.), but that is an
              entire essay in itself. Cultural change can be propagated through
              keystone social nodes: all of which are human, all of which we
              must inspire. The point remains that this is incredibly
              directionally important, and, maybe, the best position to figure
              it out is from within a lab. AI needs a public mandate, not better
              ads.
            </p>

            <p>How do we earn back trust?</p>

            <p>
              There is much work being done with public interest deployment
              groups (in hospitals, schools, labs, government): OpenAI tools
              have reached more than 500,000 students and employees across the
              CSU system, 90,000 workers across 3,500 government agencies, major
              hospital systems, and national laboratories that host roughly
              15,000 scientists. Yet, these efforts remain faint-to-invisible in
              the public eye. It is difficult for people to draw a clean line
              from more intelligence to shorter hospital waits, better schools,
              cheaper energy, or longer lives.
            </p>

            <p>
              In 2019, China’s Ministry of Science and Technology defined
              national AI experimental zones as places for “technology
              demonstrations, policy experiments, and social experiments.”
              Cities were instructed to test AI in education, healthcare,
              eldercare, government, transportation, environmental protection,
              and other public-facing domains; track effects on behavior,
              employment, and income; submit annual reports; and produce models
              that could be replicated nationally. By 2024, China reported
              operating 18 such zones.
            </p>

            <p>
              While the sanctity of such experiments under real-world political
              incentives is fuzzy at best, the directional initiative of real,
              integrated research — taking real action and bringing real people
              into the loop — is crucial. We must show that we want to iterate
              on AI as a public good for everyone, rather than waiting for
              enterprise products to spill over into daily life.
            </p>

            <p>
              What might this look like? We could start, for one, with the kids
              (who are not exactly alright). Sixty-four percent of American teens
              already use AI chatbots, yet 40% of American fourth graders
              currently read below NAEP Basic. Concretely, this could start with
              funding experimental opt-in pilot programs for AI-assisted
              education in districts that need it the most. We treat it like the
              serious research that it is: if it works, we scale, and if not, we
              say so and iterate. Trust follows proactive transparency.
            </p>

            <p>
              The same idea could apply to other surfaces: hospitals, power
              grids, supply chains, etc., etc. We must treat AI diffusion with
              the same optimistic, open, and iterative mindset that we do model
              research: this is maybe the most important experiment of our time!
            </p>

            <p>
              Done properly, AI has the potential to become not just another
              industry, but the quest of a generation — my generation. This is
              the future I believe in, and the future I want to work toward.
              American AI needs a public mandate, and America needs a new
              frontier.
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
